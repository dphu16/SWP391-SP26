package com.project.hrm.module.corehr.dto.response;

import com.project.hrm.module.corehr.dto.request.ExtractedContractDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EditChatResponse {

    /**
     * ExtractedContractDTO đã được apply thay đổi.
     * FE replace state hiện tại bằng object này.
     */
    private ExtractedContractDTO updatedData;

    /**
     * Tin nhắn xác nhận hiển thị trong chat.
     * VD: "Đã cập nhật thành công:\n• Lương cơ bản: 15000000 → 20000000"
     */
    private String confirmMessage;

    /**
     * Tóm tắt các thay đổi dạng bullet points (dùng để log/hiển thị).
     * VD: "• Lương cơ bản: 15000000 → 20000000\n• Phòng ban: Kỹ thuật → Kế toán"
     */
    private String changeSummary;

    /**
     * true  = parse + apply thành công
     * false = Groq không hiểu câu lệnh hoặc có lỗi
     */
    private boolean success;
}
