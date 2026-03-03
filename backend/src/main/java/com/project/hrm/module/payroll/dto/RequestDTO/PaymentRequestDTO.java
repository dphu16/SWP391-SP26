package com.project.hrm.module.payroll.dto.RequestDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequestDTO {
    private UUID payrollBatchId;
    private UUID requesterId; // ID of the HR user creating the request
    private BigDecimal totalAmountRequested;
    private String reportUrl;
    private String hrNote;
}
