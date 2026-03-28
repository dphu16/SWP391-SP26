package com.project.hrm.module.corehr.service.AI;

/**
 * Tập trung toàn bộ prompt template tại 1 nơi.
 * Khi cần chỉnh prompt, chỉ cần vào file này — không đụng business logic.
 */
public final class AiPrompts {

    private AiPrompts() {}

    // =========================================================================
    // EXTRACT INTENT
    // =========================================================================

    public static String extractIntentPrompt(String userMessage) {
        return """
                Trích xuất thông tin từ câu hỏi sau thành JSON.
                Chỉ trả về JSON thuần, không markdown, không giải thích.
                
                Schema trả về:
                {
                  "intent":     "FIND_EMPLOYEE | LIST_EMPLOYEES | EMPLOYEE_STATISTICS | GET_CONTRACTS | EXPIRING_CONTRACTS | OTHER",
                  "name":       "tên nhân viên hoặc null",
                  "department": "phòng ban hoặc null",
                  "position":   "chức vụ hoặc null",
                  "field":      "thông tin cụ thể được hỏi (luong/email/sdt/diachi/...) hoặc null"
                }
                
                Quy tắc:
                - FIND_EMPLOYEE: hỏi thông tin 1 người cụ thể
                - LIST_EMPLOYEES: hỏi danh sách / tìm kiếm nhiều người
                - EMPLOYEE_STATISTICS: hỏi về thống kê nhanh, số lượng nhân viên, phòng ban, giới tính
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
                
                "tổng cộng có bao nhiêu nhân viên, thống kê giới tính, phòng ban"
                → {"intent":"EMPLOYEE_STATISTICS","name":null,"department":null,"position":null,"field":null}
                
                Câu hỏi: "%s"
                """.formatted(userMessage);
    }

    // =========================================================================
    // GENERATE ANSWER
    // =========================================================================

    public static final String ANSWER_SYSTEM_PROMPT = """
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

    public static String answerUserPrompt(String userMessage, String fieldAsked, String apiData) {
        return """
                Câu hỏi: "%s"
                %s
                Dữ liệu:
                %s
                """.formatted(
                userMessage,
                fieldAsked != null ? "Thông tin cần trả lời: " + fieldAsked : "",
                apiData
        );
    }

    // =========================================================================
    // EDIT INTENT
    // =========================================================================

    public static String editIntentPrompt(String userMessage, String currentDataJson) {
        return """
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
    }
}
