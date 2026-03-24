package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.enums.TransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * UR_F004: Finance xem lịch sử giao dịch ngân hàng thực tế.
 */
@Data
@Builder
public class PaymentTransactionResponse {
    private UUID txnId;
    private UUID paymentBatchId;
    private UUID payslipId;
    private String employeeName;
    private String employeeCode;
    private String departmentName;
    private BigDecimal amount;
    private String bankReferenceNo;
    private String bankResponseCode;
    private String bankResponseMsg;
    private TransactionStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
