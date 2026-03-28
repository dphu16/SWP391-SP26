package com.project.hrm.module.payroll.dto.RequestDTO;

import com.project.hrm.module.payroll.enums.BenefitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BenefitRequest {
    @NotBlank(message = "Benefit name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Benefit type is required")
    private BenefitType benefitType;
    
    private BigDecimal standardValue;
}
