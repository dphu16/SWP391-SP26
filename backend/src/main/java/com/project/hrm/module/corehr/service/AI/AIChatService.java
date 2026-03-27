package com.project.hrm.module.corehr.service.AI;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.module.corehr.dto.request.ExtractedContractDTO;
import com.project.hrm.module.corehr.dto.response.EditChatResponse;
import com.project.hrm.module.corehr.enums.Intent;
import com.project.hrm.module.corehr.exception.GeminiException;
import com.project.hrm.module.corehr.service.helper.GroqProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.util.retry.Retry;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AIChatService {

    private final WebClient groqWebClient;
    private final WebClient hrmClient;
    private final GroqProperties groqProps;
    private final ObjectMapper objectMapper;

    // ── Parsed intent từ LLM ─────────────────────────────────────────────────
    private record IntentResult(
            Intent intent,
            String name,
            String department,
            String position,
            String field
    ) {}

    public AIChatService(
            @Qualifier("groqWebClient") WebClient groqWebClient,
            @Qualifier("hrmInternalClient") WebClient hrmInternalClient,
            GroqProperties groqProperties,
            ObjectMapper objectMapper) {
        this.groqWebClient = groqWebClient;
        this.hrmClient     = hrmInternalClient;
        this.groqProps     = groqProperties;
        this.objectMapper  = objectMapper;
    }

    // =========================================================================
    // PUBLIC — CHAT HỎI THÔNG TIN NHÂN VIÊN
    // =========================================================================

    public String chat(String userMessage, String jwtToken) {

        // Bước 1: LLM extract intent + entities (prompt ngắn, 1 việc duy nhất)
        IntentResult intent = extractIntent(userMessage);
        log.debug("Intent: {}", intent);

        // Bước 2: Java quyết định gọi API nào (deterministic, không nhờ LLM)
        String apiData = fetchData(intent, jwtToken);
        log.debug("API data length: {}", apiData != null ? apiData.length() : 0);

        // Bước 3: LLM format answer (1 việc duy nhất)
        return generateAnswer(userMessage, intent.field(), apiData);
    }

    // =========================================================================
    // BƯỚC 1 — LLM EXTRACT INTENT (prompt ngắn ~50 token)
    // =========================================================================

    private IntentResult extractIntent(String userMessage) {
        String prompt = """
                Trích xuất thông tin từ câu hỏi sau thành JSON.
                Chỉ trả về JSON thuần, không markdown, không giải thích.
                
                Schema trả về:
                {
                  "intent":     "FIND_EMPLOYEE | LIST_EMPLOYEES | GET_CONTRACTS | EXPIRING_CONTRACTS | OTHER",
                  "name":       "tên nhân viên hoặc null",
                  "department": "phòng ban hoặc null",
                  "position":   "chức vụ hoặc null",
                  "field":      "thông tin cụ thể được hỏi (luong/email/sdt/diachi/...) hoặc null"
                }
                
                Quy tắc:
                - FIND_EMPLOYEE: hỏi thông tin 1 người cụ thể
                - LIST_EMPLOYEES: hỏi danh sách / tìm kiếm nhiều người
                - GET_CONTRACTS: hỏi về hợp đồng của nhân viên
                - EXPIRING_CONTRACTS: hỏi hợp đồng sắp hết hạn
                - OTHER: câu hỏi không liên quan hoặc yêu cầu xóa/sửa dữ liệu
                - name: giữ nguyên dấu tiếng Việt nếu có
                
                Ví dụ:
                "lương của anh Hùng bên kế toán"
                → {"intent":"FIND_EMPLOYEE","name":"Hùng","department":"kế toán","position":null,"field":"luong"}
                
                "danh sách nhân viên phòng IT"
                → {"intent":"LIST_EMPLOYEES","name":null,"department":"IT","position":null,"field":null}
                
                "hợp đồng của Nguyễn Văn An"
                → {"intent":"GET_CONTRACTS","name":"Nguyễn Văn An","department":null,"position":null,"field":null}
                
                "hợp đồng sắp hết hạn"
                → {"intent":"EXPIRING_CONTRACTS","name":null,"department":null,"position":null,"field":null}
                
                Câu hỏi: "%s"
                """.formatted(userMessage);

        try {
            String raw = callGroq(
                    "Chỉ trả về JSON thuần túy, không giải thích, không markdown.",
                    prompt
            );
            String clean = raw.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
            Map<?, ?> map = objectMapper.readValue(clean, Map.class);

            return new IntentResult(
                    parseIntent((String) map.get("intent")),
                    (String) map.get("name"),
                    (String) map.get("department"),
                    (String) map.get("position"),
                    (String) map.get("field")
            );
        } catch (Exception e) {
            log.warn("Không parse được intent: {}", e.getMessage());
            return new IntentResult(Intent.OTHER, null, null, null, null);
        }
    }

    private Intent parseIntent(String raw) {
        if (raw == null) return Intent.OTHER;
        return switch (raw.toUpperCase().trim()) {
            case "FIND_EMPLOYEE"      -> Intent.FIND_EMPLOYEE;
            case "LIST_EMPLOYEES"     -> Intent.LIST_EMPLOYEES;
            case "GET_CONTRACTS"      -> Intent.GET_CONTRACTS;
            case "EXPIRING_CONTRACTS" -> Intent.EXPIRING_CONTRACTS;
            default                   -> Intent.OTHER;
        };
    }

    // =========================================================================
    // BƯỚC 2 — JAVA ROUTING (deterministic, không nhờ LLM)
    // =========================================================================

    private String fetchData(IntentResult intent, String jwtToken) {
        String bearer = "Bearer " + jwtToken;
        return switch (intent.intent()) {

            case FIND_EMPLOYEE -> {
                if (intent.name() == null)
                    yield errorJson("Vui lòng cung cấp tên nhân viên cần tìm.");
                yield resolveAndFetchEmployee(intent, bearer);
            }

            case LIST_EMPLOYEES -> {
                UriComponentsBuilder uri = UriComponentsBuilder
                        .fromPath("/api/employees/search")
                        .queryParam("size", 10);
                if (intent.name()       != null) uri.queryParam("fullName",   intent.name());
                if (intent.department() != null) uri.queryParam("department", intent.department());
                if (intent.position()   != null) uri.queryParam("position",   intent.position());

                yield hrmGet(uri.build().toUriString(), bearer);
            }

            case GET_CONTRACTS -> {
                if (intent.name() == null)
                    yield errorJson("Vui lòng cung cấp tên nhân viên cần xem hợp đồng.");

                // Tìm employeeId từ tên rồi lấy contracts
                String employeeId = resolveEmployeeId(intent.name(), intent.department(), bearer);
                if (employeeId == null)
                    yield errorJson("Không tìm thấy nhân viên tên '" + intent.name() + "'.");

                yield hrmGet("/api/employees/" + employeeId + "/contracts", bearer);
            }

            case EXPIRING_CONTRACTS ->
                    hrmGet("/api/contracts/expiring", bearer);

            case OTHER ->
                    infoJson("no_api_needed");
        };
    }

    // ── Tìm employee: search → exact match → detail ──────────────────────────
    private String resolveAndFetchEmployee(IntentResult intent, String bearer) {
        String employeeId = resolveEmployeeId(intent.name(), intent.department(), bearer);
        if (employeeId == null)
            return errorJson("Không tìm thấy nhân viên tên '" + intent.name() + "'.");

        return hrmGet("/api/employee/" + employeeId + "/view-detail", bearer);
    }

    /**
     * Tìm employeeId từ tên + department (optional).
     * Trả null nếu không tìm thấy hoặc ambiguous.
     * Trả JSON ambiguous nếu có nhiều kết quả.
     */
    private String resolveEmployeeId(String name, String department, String bearer) {
        try {
            UriComponentsBuilder uri = UriComponentsBuilder
                    .fromPath("/api/employees/search")
                    .queryParam("fullName", name)
                    .queryParam("size", 10);
            if (department != null) uri.queryParam("department", department);

            String searchResult = hrmGet(uri.build().toUriString(), bearer);
            Map<?, ?> searchMap = objectMapper.readValue(searchResult, Map.class);
            List<?> content = (List<?>) searchMap.get("content");

            if (content == null || content.isEmpty()) {
                // Fallback: thử lại với tên không dấu
                String noDiacritics = removeDiacritics(name);
                if (!noDiacritics.equals(name)) {
                    UriComponentsBuilder fallbackUri = UriComponentsBuilder
                            .fromPath("/api/employees/search")
                            .queryParam("fullName", noDiacritics)
                            .queryParam("size", 10);
                    searchResult = hrmGet(fallbackUri.build().toUriString(), bearer);
                    searchMap = objectMapper.readValue(searchResult, Map.class);
                    content = (List<?>) searchMap.get("content");
                }
            }

            if (content == null || content.isEmpty()) return null;

            // Ưu tiên exact match (normalized)
            String normalizedTarget = removeDiacritics(name).toLowerCase();
            for (Object item : content) {
                Map<?, ?> emp = (Map<?, ?>) item;
                String empName = emp.get("fullName") != null ? emp.get("fullName").toString() : "";
                if (removeDiacritics(empName).toLowerCase().equals(normalizedTarget)) {
                    return (String) emp.get("id");
                }
            }

            // Nhiều kết quả, không có exact match → trả ambiguous (caller tự xử lý)
            if (content.size() > 1) {
                List<Map<String, Object>> candidates = content.stream()
                        .map(item -> (Map<?, ?>) item)
                        .map(emp -> {
                            Map<String, Object> m = new java.util.LinkedHashMap<>();
                            m.put("fullName",   emp.get("fullName"));
                            m.put("department", emp.get("departmentName"));
                            m.put("position",   emp.get("positionName"));
                            return m;
                        })
                        .toList();
                // Trả special marker để generateAnswer xử lý
                return "AMBIGUOUS:" + objectMapper.writeValueAsString(
                        Map.of("ambiguous", true, "searchedName", name, "candidates", candidates)
                );
            }

            // Duy nhất 1 kết quả
            return (String) ((Map<?, ?>) content.get(0)).get("id");

        } catch (Exception e) {
            log.error("resolveEmployeeId lỗi: {}", e.getMessage());
            return null;
        }
    }

    // =========================================================================
    // BƯỚC 3 — LLM FORMAT ANSWER
    // =========================================================================

    private String generateAnswer(String userMessage, String fieldAsked, String apiData) {
        // Handle no_api_needed
        if (apiData == null || apiData.contains("no_api_needed")) {
            return "Xin lỗi, tôi chỉ hỗ trợ tra cứu thông tin nhân viên. "
                    + "Bạn có thể hỏi về thông tin cá nhân, lương, phòng ban, hợp đồng...";
        }

        // Handle error
        if (apiData.contains("\"error\"")) {
            try {
                Map<?, ?> err = objectMapper.readValue(apiData, Map.class);
                return (String) err.get("error");
            } catch (Exception ignored) {}
        }

        // Handle ambiguous — không cần LLM
        if (apiData.startsWith("AMBIGUOUS:")) {
            try {
                String json = apiData.substring("AMBIGUOUS:".length());
                Map<?, ?> amb = objectMapper.readValue(json, Map.class);
                List<?> candidates = (List<?>) amb.get("candidates");
                String searchedName = (String) amb.get("searchedName");

                StringBuilder sb = new StringBuilder();
                sb.append("Tìm thấy ").append(candidates.size())
                        .append(" nhân viên có tên '").append(searchedName).append("':\n");
                for (Object c : candidates) {
                    Map<?, ?> emp = (Map<?, ?>) c;
                    sb.append("• ").append(emp.get("fullName"))
                            .append(" | ").append(emp.get("department"))
                            .append(" | ").append(emp.get("position")).append("\n");
                }
                sb.append("\nBạn muốn hỏi về nhân viên nào? Vui lòng cung cấp họ tên đầy đủ hơn.");
                return sb.toString();
            } catch (Exception ignored) {}
        }

        // Normal: LLM format answer
        String systemPrompt = """
                Bạn là AI assistant HRM. Trả lời bằng tiếng Việt, ngắn gọn, thân thiện.
                
                Quy tắc:
                - Nếu hỏi field cụ thể (lương/email/sđt/...) → chỉ trả field đó, không liệt kê hết
                - Nếu hỏi thông tin chung → liệt kê các field quan trọng
                - Danh sách nhân viên → bullet points: Họ tên | Phòng ban | Chức vụ
                - Số lượng nhân viên → dùng totalElements, không tự đếm
                - Không hiển thị UUID, không bịa thông tin
                - Lương → format có dấu phẩy (15,000,000đ)
                - Ngày tháng → format dd/MM/yyyy
                """;

        String userPrompt = """
                Câu hỏi: "%s"
                %s
                Dữ liệu:
                %s
                """.formatted(
                userMessage,
                fieldAsked != null ? "Thông tin cần trả lời: " + fieldAsked : "",
                apiData
        );

        return callGroq(systemPrompt, userPrompt);
    }

    // =========================================================================
    // CHAT CHỈNH SỬA EXTRACTED DATA (giữ nguyên logic cũ)
    // =========================================================================

    public EditChatResponse editExtractedData(String userMessage, ExtractedContractDTO currentData) {
        String changesJson = parseEditIntent(userMessage, currentData);
        log.debug("Edit intent JSON: {}", changesJson);
        EditChatResponse response = applyChanges(currentData, changesJson, userMessage);
        log.info("Edit applied: {}", response.getChangeSummary());
        return response;
    }

    private String parseEditIntent(String userMessage, ExtractedContractDTO currentData) {
        String currentDataJson;
        try {
            currentDataJson = objectMapper.writeValueAsString(currentData);
        } catch (Exception e) {
            currentDataJson = "{}";
        }

        String prompt = """
                Người dùng muốn chỉnh sửa thông tin hợp đồng: <input>%s</input>
                
                Dữ liệu hiện tại:
                %s
                
                Hãy phân tích câu lệnh và trả về JSON chỉ chứa các field CẦN THAY ĐỔI.
                Chỉ trả về JSON thuần, không markdown, không giải thích.
                
                Danh sách field hợp lệ (camelCase):
                fullName, phone, email, gender (MALE/FEMALE), address, citizenId,
                taxCode, dateOfBirth (YYYY-MM-DD), baseSalary (number),
                contractNumber, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD hoặc null),
                dateOfJoining (YYYY-MM-DD), departmentName, positionName
                
                Quy tắc:
                - Chỉ include field người dùng muốn đổi
                - Ngày tháng: YYYY-MM-DD (VD: "01/05/2025" → "2025-05-01")
                - Lương: số nguyên (VD: "20 triệu" → 20000000)
                - Không hiểu → {"error": "Không hiểu yêu cầu"}
                - Không phải lệnh sửa → {"error": "Không phải lệnh chỉnh sửa"}
                """.formatted(userMessage, currentDataJson);

        return callGroq("Chỉ trả về JSON thuần túy, không giải thích, không markdown.", prompt);
    }

    private EditChatResponse applyChanges(ExtractedContractDTO currentData, String changesJson, String userMessage) {
        try {
            String clean = changesJson
                    .replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
            Map<?, ?> changes = objectMapper.readValue(clean, Map.class);

            if (changes.containsKey("error")) {
                return EditChatResponse.builder()
                        .updatedData(currentData)
                        .confirmMessage((String) changes.get("error"))
                        .success(false).build();
            }

            ExtractedContractDTO updated = objectMapper.readValue(
                    objectMapper.writeValueAsString(currentData), ExtractedContractDTO.class);

            StringBuilder summary = new StringBuilder();
            for (Map.Entry<?, ?> entry : changes.entrySet()) {
                String field = (String) entry.getKey();
                Object value = entry.getValue();
                String oldValue = getFieldValue(currentData, field);
                applyField(updated, field, value);
                summary.append(String.format("• %s: %s → %s\n",
                        fieldLabel(field), oldValue != null ? oldValue : "trống",
                        value == null ? "null" : value.toString()));
            }

            String confirmMsg = changes.isEmpty()
                    ? "Không tìm thấy thay đổi nào trong câu lệnh."
                    : "Đã cập nhật thành công:\n" + summary;

            return EditChatResponse.builder()
                    .updatedData(updated).confirmMessage(confirmMsg)
                    .changeSummary(summary.toString()).success(true).build();

        } catch (Exception e) {
            log.error("applyChanges thất bại: {}", e.getMessage());
            return EditChatResponse.builder()
                    .updatedData(currentData)
                    .confirmMessage("Không thể xử lý yêu cầu. Vui lòng thử lại.")
                    .success(false).build();
        }
    }

    private void applyField(ExtractedContractDTO dto, String field, Object value) {
        try {
            if (value == null) {
                switch (field) {
                    case "endDate" -> dto.setEndDate(null);
                    case "taxCode" -> dto.setTaxCode(null);
                }
                return;
            }
            String str = value.toString();
            switch (field) {
                case "fullName"       -> dto.setFullName(str);
                case "phone"          -> dto.setPhone(str);
                case "email"          -> dto.setEmail(str);
                case "gender"         -> dto.setGender(str);
                case "address"        -> dto.setAddress(str);
                case "citizenId"      -> dto.setCitizenId(str);
                case "taxCode"        -> dto.setTaxCode(str);
                case "contractNumber" -> dto.setContractNumber(str);
                case "departmentName" -> dto.setDepartmentName(str);
                case "positionName"   -> dto.setPositionName(str);
                case "dateOfBirth"    -> dto.setDateOfBirth(LocalDate.parse(str));
                case "startDate"      -> dto.setStartDate(LocalDate.parse(str));
                case "endDate"        -> dto.setEndDate(LocalDate.parse(str));
                case "dateOfJoining"  -> dto.setDateOfJoining(LocalDate.parse(str));
                case "baseSalary"     -> dto.setBaseSalary(new BigDecimal(str));
                default -> log.warn("Field không hợp lệ: {}", field);
            }
        } catch (Exception e) {
            log.warn("Không thể set field '{}' = '{}': {}", field, value, e.getMessage());
        }
    }

    private String getFieldValue(ExtractedContractDTO dto, String field) {
        return switch (field) {
            case "fullName"       -> dto.getFullName();
            case "phone"          -> dto.getPhone();
            case "email"          -> dto.getEmail();
            case "gender"         -> dto.getGender();
            case "address"        -> dto.getAddress();
            case "citizenId"      -> dto.getCitizenId();
            case "taxCode"        -> dto.getTaxCode();
            case "contractNumber" -> dto.getContractNumber();
            case "departmentName" -> dto.getDepartmentName();
            case "positionName"   -> dto.getPositionName();
            case "dateOfBirth"    -> dto.getDateOfBirth()    != null ? dto.getDateOfBirth().toString()    : null;
            case "startDate"      -> dto.getStartDate()      != null ? dto.getStartDate().toString()      : null;
            case "endDate"        -> dto.getEndDate()         != null ? dto.getEndDate().toString()        : null;
            case "dateOfJoining"  -> dto.getDateOfJoining()  != null ? dto.getDateOfJoining().toString()  : null;
            case "baseSalary"     -> dto.getBaseSalary()     != null ? dto.getBaseSalary().toPlainString() : null;
            default -> null;
        };
    }

    private String fieldLabel(String fieldName) {
        return switch (fieldName) {
            case "fullName"       -> "Họ tên";
            case "phone"          -> "Số điện thoại";
            case "email"          -> "Email";
            case "gender"         -> "Giới tính";
            case "address"        -> "Địa chỉ";
            case "citizenId"      -> "CCCD/CMND";
            case "taxCode"        -> "Mã số thuế";
            case "dateOfBirth"    -> "Ngày sinh";
            case "baseSalary"     -> "Lương cơ bản";
            case "contractNumber" -> "Số hợp đồng";
            case "startDate"      -> "Ngày bắt đầu";
            case "endDate"        -> "Ngày kết thúc";
            case "dateOfJoining"  -> "Ngày vào làm";
            case "departmentName" -> "Phòng ban";
            case "positionName"   -> "Chức vụ";
            default -> fieldName;
        };
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private String hrmGet(String uri, String bearer) {
        try {
            return hrmClient.get()
                    .uri(uri)
                    .header("Authorization", bearer)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
        } catch (Exception e) {
            log.error("HRM API lỗi [{}]: {}", uri, e.getMessage());
            return errorJson("Không thể lấy dữ liệu từ hệ thống.");
        }
    }

    private String callGroq(String systemPrompt, String userPrompt) {
        try {
            Map<String, Object> body = Map.of(
                    "model",       groqProps.getModel(),
                    "messages",    List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user",   "content", userPrompt)
                    ),
                    "temperature", 0,        // deterministic
                    "max_tokens",  1024,
                    "stream",      false
            );

            String raw = groqWebClient.post()
                    .uri("/v1/chat/completions")
                    .header("Authorization", "Bearer " + groqProps.getKey())
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60))
                    .retryWhen(
                            Retry.backoff(3, Duration.ofSeconds(2))
                                    .maxBackoff(Duration.ofSeconds(16))
                                    .filter(ex -> ex instanceof WebClientResponseException
                                            && ((WebClientResponseException) ex).getStatusCode().value() == 429)
                                    .doBeforeRetry(s -> log.warn("Groq 429 — retry #{}", s.totalRetries() + 1))
                    )
                    .block();

            return objectMapper.readTree(raw)
                    .path("choices").get(0)
                    .path("message")
                    .path("content").asText();

        } catch (Exception e) {
            log.error("Groq call thất bại: {}", e.getMessage());
            throw new GeminiException("Không thể kết nối AI", e);
        }
    }

    private String removeDiacritics(String input) {
        if (input == null) return "";
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[đĐ]", "d");
    }

    private String errorJson(String message) {
        return "{\"error\": \"" + message + "\"}";
    }

    private String infoJson(String message) {
        return "{\"info\": \"" + message + "\"}";
    }
}