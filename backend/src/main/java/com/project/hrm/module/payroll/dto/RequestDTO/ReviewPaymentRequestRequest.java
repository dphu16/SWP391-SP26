package com.project.hrm.module.payroll.dto.RequestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Finance duyệt hoặc từ chối payment request */
@Data
public class ReviewPaymentRequestRequest {

    @NotNull
    private Boolean approved;

    private String financeNote;
}
