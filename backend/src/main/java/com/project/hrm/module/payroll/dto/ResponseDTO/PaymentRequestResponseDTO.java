package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.entity.PaymentRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestResponseDTO {

    private String requestId;
    private String payrollBatchId;
    private String requesterId;
    private String approverId;
    private BigDecimal totalAmountRequested;
    private String status;
    private String hrNote;
    private String financeNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentRequestResponseDTO from(PaymentRequest req) {
        return PaymentRequestResponseDTO.builder()
                .requestId(req.getRequestId() != null ? req.getRequestId().toString() : null)
                .payrollBatchId(req.getPayrollBatchId() != null ? req.getPayrollBatchId().toString() : null)
                .requesterId(req.getRequesterId() != null ? req.getRequesterId().toString() : null)
                .approverId(req.getApproverId() != null ? req.getApproverId().toString() : null)
                .totalAmountRequested(req.getTotalAmountRequested())
                .status(req.getStatus())
                .hrNote(req.getHrNote())
                .financeNote(req.getFinanceNote())
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}
