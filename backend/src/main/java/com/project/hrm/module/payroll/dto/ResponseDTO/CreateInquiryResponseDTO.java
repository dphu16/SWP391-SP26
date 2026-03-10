package com.project.hrm.module.payroll.dto.ResponseDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateInquiryResponseDTO {
    @NotNull(message = "ID của thắc mắc không được để trống")
    private UUID inquiryId;

    // Trong thực tế responderId thường lấy từ Token đăng nhập (JWT),
    // nhưng ở đây mình để trong DTO cho dễ hình dung luồng dữ liệu.
    @NotNull(message = "ID của HR không được để trống")
    private UUID responderId;

    @NotBlank(message = "Nội dung phản hồi không được để trống")
    private String officialResponse;

    private String internalNote;
    private String attachmentUrl;
}
