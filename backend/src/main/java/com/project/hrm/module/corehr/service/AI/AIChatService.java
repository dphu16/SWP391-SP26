package com.project.hrm.module.corehr.service.AI;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.module.corehr.dto.request.ExtractedContractDTO;
import com.project.hrm.module.corehr.dto.response.EditChatResponse;
import com.project.hrm.module.corehr.exception.GeminiException;
import com.project.hrm.module.corehr.service.helper.GroqProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
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

    public AIChatService(
            @Qualifier("groqWebClient") WebClient groqWebClient,
            @Qualifier("hrmInternalClient") WebClient hrmInternalClient,
            GroqProperties groqProperties,
            ObjectMapper objectMapper) {
        this.groqWebClient = groqWebClient;
        this.hrmClient = hrmInternalClient;
        this.groqProps = groqProperties;
        this.objectMapper = objectMapper;
    }

    // =========================================================================
    // CHAT HỎI THÔNG TIN NHÂN VIÊN (logic cũ — giữ nguyên)
    // =========================================================================

    public String chat(String userMessage, String jwtToken) {
        String apiPlan = askWhatApiToCall(userMessage);
        log.debug("API plan: {}", apiPlan);

        String apiData = fetchDataFromApi(apiPlan, jwtToken);
        log.debug("API data length: {}", apiData.length());

        return askToAnswer(userMessage, apiData);
    }

    // =========================================================================
    // CHAT CHỈNH SỬA EXTRACTED DATA (logic mới)
    // =========================================================================

    /**
     * HR dùng ngôn ngữ tự nhiên để chỉnh sửa extractedData sau khi scan.
     *
     * Ví dụ:
     * - "sửa lương thành 20 triệu"
     * - "đổi phòng ban thành Kế toán và chức vụ là Trưởng phòng"
     * - "ngày vào làm là 01/05/2025"
     *
     * Flow:
     * 1. Groq parse câu lệnh tự nhiên → JSON các field cần sửa
     * 2. Apply changes vào extractedData hiện tại
     * 3. Trả về extractedData đã update + confirm message
     *
     * @param userMessage    Câu lệnh tự nhiên của HR
     * @param currentData    ExtractedContractDTO hiện tại (FE gửi kèm)
     * @return               EditChatResponse gồm updatedData + confirmMessage
     */
    public EditChatResponse editExtractedData(String userMessage, ExtractedContractDTO currentData) {

        // Bước 1: Groq parse câu lệnh → JSON changes
        String changesJson = parseEditIntent(userMessage, currentData);
        log.debug("Edit intent JSON: {}", changesJson);

        // Bước 2: Apply changes vào currentData
        EditChatResponse response = applyChanges(currentData, changesJson, userMessage);
        log.info("Edit applied: {}", response.getChangeSummary());

        return response;
    }

    /**
     * Dùng Groq để parse câu lệnh tự nhiên → JSON các field cần thay đổi.
     * Chỉ trả về những field CÓ thay đổi, không trả toàn bộ object.
     */
    private String parseEditIntent(String userMessage, ExtractedContractDTO currentData) {
        String currentDataJson;
        try {
            currentDataJson = objectMapper.writeValueAsString(currentData);
        } catch (Exception e) {
            currentDataJson = "{}";
        }

        String prompt = """
            Người dùng muốn chỉnh sửa thông tin hợp đồng: "%s"
            
            Dữ liệu hiện tại:
            %s
            
            Hãy phân tích câu lệnh và trả về JSON chỉ chứa các field CẦN THAY ĐỔI.
            Chỉ trả về JSON thuần, không markdown, không giải thích.
            
            Danh sách field hợp lệ (camelCase):
            - fullName       (string)
            - phone          (string)
            - email          (string)
            - gender         (string: "MALE" hoặc "FEMALE")
            - address        (string)
            - citizenId      (string)
            - taxCode        (string)
            - dateOfBirth    (string: YYYY-MM-DD)
            - baseSalary     (number)
            - contractNumber (string)
            - contractType   (string)
            - startDate      (string: YYYY-MM-DD)
            - endDate        (string: YYYY-MM-DD hoặc null)
            - dateOfJoining  (string: YYYY-MM-DD)
            - departmentName (string)
            - positionName   (string)
            
            Quy tắc:
            - Chỉ include field người dùng muốn đổi, bỏ qua các field khác
            - Ngày tháng: chuyển về YYYY-MM-DD (VD: "01/05/2025" → "2025-05-01")
            - Lương: chỉ số nguyên (VD: "20 triệu" → 20000000, "15tr" → 15000000)
            - Nếu không hiểu câu lệnh → trả về: {"error": "Không hiểu yêu cầu"}
            - Nếu câu lệnh không phải chỉnh sửa → trả về: {"error": "Không phải lệnh chỉnh sửa"}
            
            Ví dụ:
            "sửa lương thành 20 triệu"                        → {"baseSalary": 20000000}
            "đổi phòng ban thành Kế toán"                     → {"departmentName": "Kế toán"}
            "sửa lương 20tr và phòng ban là Kế toán"          → {"baseSalary": 20000000, "departmentName": "Kế toán"}
            "ngày vào làm là 01/05/2025"                      → {"dateOfJoining": "2025-05-01"}
            "chức vụ là Trưởng phòng Kỹ thuật"               → {"positionName": "Trưởng phòng Kỹ thuật"}
            "hợp đồng không xác định thời hạn"               → {"contractType": "Không xác định thời hạn", "endDate": null}
            """.formatted(userMessage, currentDataJson);

        return callGroq(
            "Chỉ trả về JSON thuần túy, không giải thích, không markdown.",
            prompt
        );
    }

    /**
     * Apply JSON changes vào ExtractedContractDTO hiện tại.
     * Trả về EditChatResponse gồm updatedData + confirmMessage.
     */
    private EditChatResponse applyChanges(
            ExtractedContractDTO currentData,
            String changesJson,
            String userMessage) {

        try {
            String clean = changesJson
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("```", "")
                    .trim();

            Map<?, ?> changes = objectMapper.readValue(clean, Map.class);

            // Groq không hiểu câu lệnh
            if (changes.containsKey("error")) {
                return EditChatResponse.builder()
                        .updatedData(currentData)
                        .confirmMessage((String) changes.get("error"))
                        .success(false)
                        .build();
            }

            // Clone DTO để không mutate object gốc
            ExtractedContractDTO updated = objectMapper.readValue(
                    objectMapper.writeValueAsString(currentData),
                    ExtractedContractDTO.class
            );

            StringBuilder summary = new StringBuilder();

            // Apply từng field thay đổi
            for (Map.Entry<?, ?> entry : changes.entrySet()) {
                String field = (String) entry.getKey();
                Object value = entry.getValue();
                String oldValue = getFieldValue(currentData, field);

                applyField(updated, field, value);

                String newValue = value == null ? "null" : value.toString();
                summary.append(String.format("• %s: %s → %s\n",
                        fieldLabel(field), oldValue != null ? oldValue : "trống", newValue));
            }

            String confirmMsg = changes.isEmpty()
                    ? "Không tìm thấy thay đổi nào trong câu lệnh."
                    : "Đã cập nhật thành công:\n" + summary;

            return EditChatResponse.builder()
                    .updatedData(updated)
                    .confirmMessage(confirmMsg)
                    .changeSummary(summary.toString())
                    .success(true)
                    .build();

        } catch (Exception e) {
            log.error("applyChanges thất bại: {}", e.getMessage());
            return EditChatResponse.builder()
                    .updatedData(currentData)
                    .confirmMessage("Không thể xử lý yêu cầu. Vui lòng thử lại.")
                    .success(false)
                    .build();
        }
    }

    /**
     * Set giá trị vào đúng field của ExtractedContractDTO.
     */
    private void applyField(ExtractedContractDTO dto, String field, Object value) {
        try {
            if (value == null) {
                switch (field) {
                    case "endDate"   -> dto.setEndDate(null);
                    case "taxCode"   -> dto.setTaxCode(null);
                }
                return;
            }
            String str = value.toString();
            switch (field) {
                case "fullName"        -> dto.setFullName(str);
                case "phone"           -> dto.setPhone(str);
                case "email"           -> dto.setEmail(str);
                case "gender"          -> dto.setGender(str);
                case "address"         -> dto.setAddress(str);
                case "citizenId"       -> dto.setCitizenId(str);
                case "taxCode"         -> dto.setTaxCode(str);
                case "contractNumber"  -> dto.setContractNumber(str);
                case "contractType"    -> dto.setContractType(str);
                case "departmentName"  -> dto.setDepartmentName(str);
                case "positionName"    -> dto.setPositionName(str);
                case "dateOfBirth"     -> dto.setDateOfBirth(LocalDate.parse(str));
                case "startDate"       -> dto.setStartDate(LocalDate.parse(str));
                case "endDate"         -> dto.setEndDate(LocalDate.parse(str));
                case "dateOfJoining"   -> dto.setDateOfJoining(LocalDate.parse(str));
                case "baseSalary"      -> dto.setBaseSalary(new BigDecimal(str));
                default -> log.warn("Field không hợp lệ: {}", field);
            }
        } catch (Exception e) {
            log.warn("Không thể set field '{}' = '{}': {}", field, value, e.getMessage());
        }
    }

    /**
     * Lấy giá trị hiện tại của field để hiển thị trong confirm message.
     */
    private String getFieldValue(ExtractedContractDTO dto, String field) {
        return switch (field) {
            case "fullName"        -> dto.getFullName();
            case "phone"           -> dto.getPhone();
            case "email"           -> dto.getEmail();
            case "gender"          -> dto.getGender();
            case "address"         -> dto.getAddress();
            case "citizenId"       -> dto.getCitizenId();
            case "taxCode"         -> dto.getTaxCode();
            case "contractNumber"  -> dto.getContractNumber();
            case "contractType"    -> dto.getContractType();
            case "departmentName"  -> dto.getDepartmentName();
            case "positionName"    -> dto.getPositionName();
            case "dateOfBirth"     -> dto.getDateOfBirth() != null ? dto.getDateOfBirth().toString() : null;
            case "startDate"       -> dto.getStartDate() != null ? dto.getStartDate().toString() : null;
            case "endDate"         -> dto.getEndDate() != null ? dto.getEndDate().toString() : null;
            case "dateOfJoining"   -> dto.getDateOfJoining() != null ? dto.getDateOfJoining().toString() : null;
            case "baseSalary"      -> dto.getBaseSalary() != null ? dto.getBaseSalary().toPlainString() : null;
            default -> null;
        };
    }

    private String fieldLabel(String fieldName) {
        return switch (fieldName) {
            case "fullName"        -> "Họ tên";
            case "phone"           -> "Số điện thoại";
            case "email"           -> "Email";
            case "gender"          -> "Giới tính";
            case "address"         -> "Địa chỉ";
            case "citizenId"       -> "CCCD/CMND";
            case "taxCode"         -> "Mã số thuế";
            case "dateOfBirth"     -> "Ngày sinh";
            case "baseSalary"      -> "Lương cơ bản";
            case "contractNumber"  -> "Số hợp đồng";
            case "contractType"    -> "Loại hợp đồng";
            case "startDate"       -> "Ngày bắt đầu";
            case "endDate"         -> "Ngày kết thúc";
            case "dateOfJoining"   -> "Ngày vào làm";
            case "departmentName"  -> "Phòng ban";
            case "positionName"    -> "Chức vụ";
            default -> fieldName;
        };
    }

    // =========================================================================
    // LOGIC CŨ — giữ nguyên
    // =========================================================================

    private String askWhatApiToCall(String userMessage) {
        String prompt = """
        Bạn là AI assistant của hệ thống HRM. Người dùng hỏi:
        "%s"
        
        Dựa vào câu hỏi, hãy quyết định cần gọi API nào để lấy dữ liệu.
        Chỉ trả về JSON thuần, không markdown, không giải thích.
        
        Các API có sẵn:
        1. {"api": "SEARCH_EMPLOYEES", "params": {"fullName": "tên nếu có", "department": "phòng ban nếu có", "position": "chức vụ nếu có", "status": "trạng thái nếu có", "role": "role nếu có"}}
        2. {"api": "GET_EMPLOYEE_DETAIL", "params": {"fullName": "tên nhân viên"}}
        3. {"api": "GET_CONTRACTS", "params": {"employeeId": "uuid"}}
        4. {"api": "GET_EXPIRING_CONTRACTS", "params": {}}
        5. {"api": "NO_API", "params": {}}
        
        Quy tắc chọn API:
        - Hỏi thông tin cụ thể của 1 người (email, số điện thoại, ngày sinh, lương, địa chỉ, phòng ban...) → GET_EMPLOYEE_DETAIL
        - Hỏi danh sách, bao nhiêu người, tìm theo điều kiện → SEARCH_EMPLOYEES
        - Hỏi hợp đồng cụ thể của 1 người → GET_CONTRACTS
        - Hỏi hợp đồng sắp hết hạn → GET_EXPIRING_CONTRACTS
        - Chào hỏi, câu hỏi chung → NO_API
        
        Ví dụ:
        - "email của Nguyễn Văn An là gì?" → {"api": "GET_EMPLOYEE_DETAIL", "params": {"fullName": "Nguyễn Văn An"}}
        - "số điện thoại của Trần Thị B" → {"api": "GET_EMPLOYEE_DETAIL", "params": {"fullName": "Trần Thị B"}}
        - "lương của Phùng Đình Phú" → {"api": "GET_EMPLOYEE_DETAIL", "params": {"fullName": "Phùng Đình Phú"}}
        - "Cho tôi xem thông tin Nguyễn Văn An" → {"api": "GET_EMPLOYEE_DETAIL", "params": {"fullName": "Nguyễn Văn An"}}
        - "Danh sách nhân viên phòng kỹ thuật" → {"api": "SEARCH_EMPLOYEES", "params": {"department": "Kỹ thuật"}}
        - "Có bao nhiêu nhân viên?" → {"api": "SEARCH_EMPLOYEES", "params": {}}
        - "Hợp đồng nào sắp hết hạn" → {"api": "GET_EXPIRING_CONTRACTS", "params": {}}
        - "Xin chào" → {"api": "NO_API", "params": {}}
        """.formatted(userMessage);

        return callGroq("Chỉ trả về JSON thuần túy, không giải thích, không markdown.", prompt);
    }

    private String fetchDataFromApi(String apiPlanJson, String jwtToken) {
        try {
            String clean = apiPlanJson
                    .replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            log.info("=== Groq API plan raw: {}", clean);

            Map<?, ?> plan = objectMapper.readValue(clean, Map.class);
            String api = (String) plan.get("api");
            Map<?, ?> params = (Map<?, ?>) plan.get("params");

            String bearer = "Bearer " + jwtToken;

            return switch (api) {

                case "SEARCH_EMPLOYEES" -> {
                    StringBuilder uri = new StringBuilder("/api/employees/search?size=20");
                    if (params.get("fullName") != null)
                        uri.append("&fullName=").append(params.get("fullName"));
                    if (params.get("department") != null)
                        uri.append("&department=").append(params.get("department"));
                    if (params.get("position") != null)
                        uri.append("&position=").append(params.get("position"));
                    if (params.get("status") != null)
                        uri.append("&status=").append(params.get("status"));
                    if (params.get("role") != null)
                        uri.append("&role=").append(params.get("role"));

                    yield hrmClient.get()
                            .uri(uri.toString())
                            .header("Authorization", bearer)
                            .retrieve()
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(10))
                            .block();
                }

                case "GET_EMPLOYEE_DETAIL" -> {
                    String employeeId = (String) params.get("employeeId");

                    if (employeeId == null && params.get("fullName") != null) {
                        String nameToSearch = params.get("fullName").toString();
                        log.info("=== Tìm NV: '{}'", nameToSearch);

                        String searchResult = hrmClient.get()
                                .uri("/api/employees/search?fullName={name}&size=5", nameToSearch)
                                .header("Authorization", bearer)
                                .retrieve()
                                .bodyToMono(String.class)
                                .timeout(Duration.ofSeconds(10))
                                .block();

                        Map<?, ?> searchMap = objectMapper.readValue(searchResult, Map.class);
                        List<?> content = (List<?>) searchMap.get("content");

                        if (content == null || content.isEmpty()) {
                            yield "{\"error\": \"Không tìm thấy nhân viên\"}";
                        }

                        Map<?, ?> first = (Map<?, ?>) content.get(0);
                        employeeId = (String) first.get("id");
                        log.info("=== employeeId: {}", employeeId);
                    }

                    if (employeeId == null) yield "{\"error\": \"Không có employeeId\"}";

                    log.info("=== Gọi view-detail cho: {}", employeeId);
                    String detail = hrmClient.get()
                            .uri("/api/employee/{id}/view-detail", employeeId)
                            .header("Authorization", bearer)
                            .retrieve()
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(10))
                            .block();
                    log.info("=== view-detail length: {}", detail != null ? detail.length() : 0);
                    yield detail;
                }

                case "GET_CONTRACTS" -> {
                    String employeeId = (String) params.get("employeeId");
                    if (employeeId == null) yield "{\"error\": \"Cần employeeId\"}";

                    yield hrmClient.get()
                            .uri("/api/employees/{id}/contracts", employeeId)
                            .header("Authorization", bearer)
                            .retrieve()
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(10))
                            .block();
                }

                case "GET_EXPIRING_CONTRACTS" ->
                        hrmClient.get()
                                .uri("/api/contracts/expiring")
                                .header("Authorization", bearer)
                                .retrieve()
                                .bodyToMono(String.class)
                                .timeout(Duration.ofSeconds(10))
                                .block();

                default -> "{\"info\": \"no_api_needed\"}";
            };

        } catch (Exception e) {
            log.error("Lỗi gọi HRM API: {}", e.getMessage());
            return "{\"error\": \"" + e.getMessage() + "\"}";
        }
    }

    private String askToAnswer(String userMessage, String apiData) {
        String systemPrompt = """
            Bạn là AI assistant của hệ thống HRM (Human Resource Management).
            Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.
            Nếu là danh sách → dùng bullet points.
            Nếu là thông tin cá nhân → liệt kê các field quan trọng.
            Nếu không tìm thấy dữ liệu → thông báo lịch sự.
            Không bịa thêm thông tin. Không hiển thị UUID thô.
            Khi hỏi về số lượng → dùng field "totalElements" trong data, không tự đếm.
            Trả lời có cách dòng format đẹp
            """;

        String userPrompt = """
                Người dùng hỏi: "%s"
                
                Dữ liệu từ hệ thống:
                %s
                """.formatted(userMessage, apiData);

        return callGroq(systemPrompt, userPrompt);
    }

    private String callGroq(String systemPrompt, String userPrompt) {
        try {
            Map<String, Object> body = Map.of(
                    "model",       groqProps.getModel(),
                    "messages",    List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user",   "content", userPrompt)
                    ),
                    "temperature", 0.2,
                    "max_tokens",  2048,
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
                                    .doBeforeRetry(s -> log.warn(
                                            "Groq 429 — retry #{}", s.totalRetries() + 1))
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
}
