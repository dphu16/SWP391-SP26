package com.project.hrm.module.payroll.dto.ResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalResponseDTO {
    private UUID requestId;
    private UUID sourceAccountId; // The company account paying for this
    private UUID approverId;      // The Finance Manager's ID
    private String bankRefCode;   // The reference code from the bank transfer
    private String financeNote;
}
