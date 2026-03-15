package com.project.hrm.module.corehr.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EditChatRequest {

    /**
     * Câu lệnh tự nhiên của HR.
     * VD: "sửa lương thành 20 triệu", "đổi phòng ban thành Kế toán"
     */
    @NotBlank
    private String message;

    /**
     * ExtractedContractDTO hiện tại — FE giữ state và gửi kèm mỗi request.
     * Backend apply changes vào object này và trả về bản đã cập nhật.
     */
    @NotNull
    @Valid
    private ExtractedContractDTO currentData;
}
