package com.project.hrm.module.payroll.dto.ResponseDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/** HR phản hồi thắc mắc lương */
@Data
public class RespondToInquiryRequest {

    @NotNull
    private UUID inquiryId;

    @NotBlank
    private String officialResponse;

    /** Ghi chú nội bộ — không hiển thị cho nhân viên */
    private String internalNote;

    private String attachmentUrl;
}
