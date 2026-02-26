package com.project.hrm.payroll.compensation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class PayslipItemDTO {
    private String itemName;
    private BigDecimal amount;
}
