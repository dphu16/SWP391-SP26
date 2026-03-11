package com.project.hrm.module.corehr.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BankAccountDTO {

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    private String branchName;

    private String accountHolderName;
}
