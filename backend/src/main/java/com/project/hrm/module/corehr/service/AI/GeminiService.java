package com.project.hrm.module.corehr.service.AI;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.module.corehr.dto.request.ExtractedContractDTO;

import com.project.hrm.module.corehr.exception.GeminiException;
import com.project.hrm.module.corehr.service.helper.GeminiProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    private final WebClient geminiWebClient;
    private final GeminiProperties geminiProps;
    private final ObjectMapper objectMapper;

    public GeminiService(
            @Qualifier("geminiWebClient") WebClient geminiWebClient,
            GeminiProperties geminiProps,
            ObjectMapper objectMapper) {
        this.geminiWebClient = geminiWebClient;
        this.geminiProps = geminiProps;
        this.objectMapper = objectMapper;
    }

    /**
     * Kết quả extract từ Gemini gồm:
     * - extractedData : flat DTO để map vào form + /create-and-submit
     */
    public record GeminiResult(ExtractedContractDTO extractedData) {}

    public GeminiResult extractFromContract(byte[] fileBytes, String mimeType) {
        String base64 = java.util.Base64.getEncoder().encodeToString(fileBytes);

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(
                    Map.of("inline_data", Map.of(
                        "mime_type", mimeType,
                        "data", base64
                    )),
                    Map.of("text", buildPrompt())
                )
            )),
            "generationConfig", Map.of(
                "temperature", 0.1,
                "responseMimeType", "application/json"
            )
        );

        String raw = geminiWebClient.post()
            .uri("/v1beta/models/{model}:generateContent?key={key}",
                geminiProps.getModel(), geminiProps.getKey())
            .bodyValue(body)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofSeconds(90))
            .block();

        return parseResponse(raw);
    }

    private String buildPrompt() {
        return """
            Đây là hợp đồng lao động. Trích xuất thông tin và trả về JSON thuần túy.
            Không markdown, không giải thích, chỉ JSON.

            QUAN TRỌNG:
            - Các giá trị string phải sao chép CHÍNH XÁC từ văn bản gốc (giữ nguyên dấu tiếng Việt,
              cách viết hoa, ký tự đặc biệt) vì sẽ được dùng để tìm kiếm lại trong file.
            - Với mỗi field, đánh giá "sure": true nếu bạn nhìn thấy rõ ràng trong văn bản,
              false nếu bạn phải suy luận, ước đoán, hoặc text không rõ ràng.

            Trả về đúng cấu trúc:
            {
              "fields": [
                { "fieldName": "fullName",       "value": "Họ và tên",         "sure": true  },
                { "fieldName": "phone",          "value": "Số điện thoại",     "sure": true  },
                { "fieldName": "email",          "value": "Email",             "sure": true  },
                { "fieldName": "gender",         "value": "MALE hoặc FEMALE",  "sure": true  },
                { "fieldName": "address",        "value": "Địa chỉ",           "sure": true  },
                { "fieldName": "citizenId",      "value": "Số CCCD/CMND",      "sure": true  },
                { "fieldName": "taxCode",        "value": "Mã số thuế",        "sure": true  },
                { "fieldName": "dateOfBirth",    "value": "YYYY-MM-DD",        "sure": true  },
                { "fieldName": "baseSalary",     "value": "15000000",          "sure": true  },
                { "fieldName": "contractNumber", "value": "Số HĐ",             "sure": true  },
                { "fieldName": "contractType",   "value": "Loại HĐ",           "sure": true  },
                { "fieldName": "startDate",      "value": "YYYY-MM-DD",        "sure": true  },
                { "fieldName": "endDate",        "value": "YYYY-MM-DD",        "sure": true  },
                { "fieldName": "dateOfJoining",  "value": "YYYY-MM-DD",        "sure": true  },
                { "fieldName": "departmentName", "value": "Tên phòng ban",     "sure": true  },
                { "fieldName": "positionName",   "value": "Tên chức vụ",       "sure": false }
              ]
            }

            Quy tắc value:
            - Ngày tháng: YYYY-MM-DD, null nếu không có
            - baseSalary: chỉ số nguyên, null nếu không có
            - gender: chỉ "MALE" hoặc "FEMALE", null nếu không rõ
            - String không tìm thấy: null
            - Không dùng chuỗi rỗng ""

            Quy tắc sure:
            - true  : nhìn thấy rõ ràng, chép nguyên văn từ hợp đồng
            - false : phải suy luận, text bị mờ/cắt, hoặc không tìm thấy (value = null)
            """;
    }

    private GeminiResult parseResponse(String raw) {
        try {
            JsonNode root = objectMapper.readTree(raw);
            String jsonText = root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text").asText();

            jsonText = jsonText
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("```", "")
                .trim();

            log.debug("Gemini raw JSON: {}", jsonText);

            JsonNode responseNode = objectMapper.readTree(jsonText);
            JsonNode fieldsNode = responseNode.path("fields");

            ExtractedContractDTO dto = new ExtractedContractDTO();

            for (JsonNode fieldNode : fieldsNode) {
                String fieldName = fieldNode.path("fieldName").asText();
                String value     = fieldNode.path("value").isNull() ? null : fieldNode.path("value").asText();

                // Map vào flat DTO
                mapToDto(dto, fieldName, value);
            }

            log.info("Gemini extracted contract completely");

            return new GeminiResult(dto);

        } catch (Exception e) {
            log.error("Parse Gemini response thất bại: {}", raw, e);
            throw new GeminiException("Không thể đọc thông tin từ file. Vui lòng thử lại.");
        }
    }

    /**
     * Map value string → đúng kiểu trong ExtractedContractDTO.
     */
    private void mapToDto(ExtractedContractDTO dto, String fieldName, String value) {
        if (value == null || value.isBlank()) return;
        try {
            switch (fieldName) {
                case "fullName"        -> dto.setFullName(value);
                case "phone"           -> dto.setPhone(value);
                case "email"           -> dto.setEmail(value);
                case "gender"          -> dto.setGender(value);
                case "address"         -> dto.setAddress(value);
                case "citizenId"       -> dto.setCitizenId(value);
                case "taxCode"         -> dto.setTaxCode(value);
                case "contractNumber"  -> dto.setContractNumber(value);
                case "contractType"    -> dto.setContractType(value);
                case "departmentName"  -> dto.setDepartmentName(value);
                case "positionName"    -> dto.setPositionName(value);
                case "dateOfBirth"     -> dto.setDateOfBirth(LocalDate.parse(value));
                case "startDate"       -> dto.setStartDate(LocalDate.parse(value));
                case "endDate"         -> dto.setEndDate(LocalDate.parse(value));
                case "dateOfJoining"   -> dto.setDateOfJoining(LocalDate.parse(value));
                case "baseSalary"      -> dto.setBaseSalary(new BigDecimal(value));
            }
        } catch (Exception e) {
            log.warn("Không thể map field '{}' với value '{}': {}", fieldName, value, e.getMessage());
        }
    }
}
