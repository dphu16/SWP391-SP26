package com.project.hrm.module.payroll.dto.RequestDTO;

import com.project.hrm.module.payroll.enums.PaymentRequestType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/** HR gửi yêu cầu thanh toán lương sang Finance */
@Data
public class CreatePaymentRequestRequest {

    @NotNull
    private UUID payrollBatchId;

    @NotNull
    private UUID sourceAccountId;

    private String hrNote;

    /** URL file báo cáo lương đính kèm (PDF/Excel) */
    private String reportUrl;

    @NotNull
    private PaymentRequestType type;
}
