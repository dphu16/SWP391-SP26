package com.project.hrm.module.corehr.service.AI;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.module.corehr.dto.request.ExtractedContractDTO;
import com.project.hrm.module.corehr.dto.response.EditChatResponse;
import com.project.hrm.module.corehr.enums.Intent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Orchestrator: điều phối 3 bước chat (extract intent → fetch data → generate answer).
 * Không chứa HTTP code, không chứa prompt template dài — các thứ đó đã được tách ra.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AIChatService {

    private final GroqClient groqClient;
    private final HrmApiClient hrmApiClient;
    private final EmployeeResolver employeeResolver;
    private final ObjectMapper objectMapper;

    // =========================================================================
    // PUBLIC — CHAT HỎI THÔNG TIN NHÂN VIÊN
    // =========================================================================

    public String chat(String userMessage, String jwtToken) {
        String bearer = "Bearer " + jwtToken;

        IntentResult intent = extractIntent(userMessage);
        log.debug("Intent: {}", intent);

        String apiData = fetchData(intent, bearer);
        log.debug("API data length: {}", apiData != null ? apiData.length() : 0);

        return generateAnswer(userMessage, intent.field(), apiData);
    }

    // =========================================================================
    // PUBLIC — CHAT CHỈNH SỬA EXTRACTED DATA
    // =========================================================================

    public EditChatResponse editExtractedData(String userMessage, ExtractedContractDTO currentData) {
        String changesJson = parseEditIntent(userMessage, currentData);
        log.debug("Edit intent JSON: {}", changesJson);
        EditChatResponse response = applyChanges(currentData, changesJson);
        log.info("Edit applied: {}", response.getChangeSummary());
        return response;
    }

    // =========================================================================
    // BƯỚC 1 — EXTRACT INTENT
    // =========================================================================

    private record IntentResult(Intent intent, String name, String department, String position, String field) {}

    private IntentResult extractIntent(String userMessage) {
        String prompt = AiPrompts.extractIntentPrompt(userMessage);
        try {
            String raw   = groqClient.callForJson(prompt);
            String clean = stripMarkdown(raw);
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
            case "FIND_EMPLOYEE"       -> Intent.FIND_EMPLOYEE;
            case "LIST_EMPLOYEES"      -> Intent.LIST_EMPLOYEES;
            case "EMPLOYEE_STATISTICS" -> Intent.EMPLOYEE_STATISTICS;
            case "GET_CONTRACTS"       -> Intent.GET_CONTRACTS;
            case "EXPIRING_CONTRACTS"  -> Intent.EXPIRING_CONTRACTS;
            default                    -> Intent.OTHER;
        };
    }

    // =========================================================================
    // BƯỚC 2 — FETCH DATA
    // =========================================================================

    private String fetchData(IntentResult intent, String bearer) {
        return switch (intent.intent()) {

            case FIND_EMPLOYEE -> {
                if (intent.name() == null) yield errorJson("Vui lòng cung cấp tên nhân viên cần tìm.");
                String id = employeeResolver.resolve(intent.name(), intent.department(), bearer);
                if (id == null)                        yield errorJson("Không tìm thấy nhân viên tên '" + intent.name() + "'.");
                if (EmployeeResolver.isAmbiguous(id))  yield id;
                yield hrmApiClient.getEmployeeDetail(id, bearer);
            }

            case LIST_EMPLOYEES ->
                hrmApiClient.searchEmployees(intent.name(), intent.department(), intent.position(), 10, bearer);

            case GET_CONTRACTS -> {
                if (intent.name() == null) yield errorJson("Vui lòng cung cấp tên nhân viên cần xem hợp đồng.");
                String id = employeeResolver.resolve(intent.name(), intent.department(), bearer);
                if (id == null)                        yield errorJson("Không tìm thấy nhân viên tên '" + intent.name() + "'.");
                if (EmployeeResolver.isAmbiguous(id))  yield id;
                yield hrmApiClient.getEmployeeContracts(id, bearer);
            }

            case EXPIRING_CONTRACTS  -> hrmApiClient.getExpiringContracts(bearer);
            case EMPLOYEE_STATISTICS -> hrmApiClient.getEmployeeStatistics(bearer);
            case OTHER               -> infoJson("no_api_needed");
        };
    }

    // =========================================================================
    // BƯỚC 3 — GENERATE ANSWER
    // =========================================================================

    private String generateAnswer(String userMessage, String fieldAsked, String apiData) {
        if (apiData == null || apiData.contains("no_api_needed"))
            return "Xin lỗi, tôi chỉ hỗ trợ tra cứu thông tin nhân viên. Bạn có thể hỏi về thông tin cá nhân, lương, phòng ban, hợp đồng...";

        if (apiData.contains("\"error\""))
            return extractErrorMessage(apiData);

        if (EmployeeResolver.isAmbiguous(apiData))
            return formatAmbiguousMessage(apiData);

        return groqClient.call(
                AiPrompts.ANSWER_SYSTEM_PROMPT,
                AiPrompts.answerUserPrompt(userMessage, fieldAsked, apiData)
        );
    }

    private String extractErrorMessage(String apiData) {
        try {
            Map<?, ?> err = objectMapper.readValue(apiData, Map.class);
            return (String) err.get("error");
        } catch (Exception ignored) {
            return "Đã xảy ra lỗi, vui lòng thử lại.";
        }
    }

    private String formatAmbiguousMessage(String apiData) {
        try {
            String json = apiData.substring(EmployeeResolver.AMBIGUOUS_PREFIX.length());
            Map<?, ?> amb = objectMapper.readValue(json, Map.class);
            List<?> candidates  = (List<?>) amb.get("candidates");
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
        } catch (Exception ignored) {
            return "Tìm thấy nhiều nhân viên trùng tên. Vui lòng cung cấp họ tên đầy đủ hơn.";
        }
    }

    // =========================================================================
    // EDIT INTENT — parse + apply
    // =========================================================================

    private String parseEditIntent(String userMessage, ExtractedContractDTO currentData) {
        try {
            String currentDataJson = objectMapper.writeValueAsString(currentData);
            return groqClient.callForJson(AiPrompts.editIntentPrompt(userMessage, currentDataJson));
        } catch (Exception e) {
            return "{\"error\": \"Không thể đọc dữ liệu hiện tại.\"}";
        }
    }

    private EditChatResponse applyChanges(ExtractedContractDTO currentData, String changesJson) {
        try {
            String clean  = stripMarkdown(changesJson);
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
                String field    = (String) entry.getKey();
                Object value    = entry.getValue();
                String oldValue = getFieldValue(currentData, field);
                applyField(updated, field, value);
                summary.append(String.format("• %s: %s → %s\n",
                        ContractFieldMeta.label(field),
                        oldValue != null ? oldValue : "trống",
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

    // ── Apply / get field value ──────────────────────────────────────────────

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
            case "dateOfBirth"    -> dto.getDateOfBirth()   != null ? dto.getDateOfBirth().toString()   : null;
            case "startDate"      -> dto.getStartDate()     != null ? dto.getStartDate().toString()     : null;
            case "endDate"        -> dto.getEndDate()       != null ? dto.getEndDate().toString()       : null;
            case "dateOfJoining"  -> dto.getDateOfJoining() != null ? dto.getDateOfJoining().toString() : null;
            case "baseSalary"     -> dto.getBaseSalary()    != null ? dto.getBaseSalary().toPlainString() : null;
            default -> null;
        };
    }

    // ── Util ─────────────────────────────────────────────────────────────────

    private String stripMarkdown(String raw) {
        return raw.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
    }

    private String errorJson(String message) {
        return "{\"error\": \"" + message + "\"}";
    }

    private String infoJson(String message) {
        return "{\"info\": \"" + message + "\"}";
    }
}
