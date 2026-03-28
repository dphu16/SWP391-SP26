package com.project.hrm.module.payroll.dto.ResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxReportResponse {
    private UUID employeeId;
    private String employeeCode;
    private String employeeName;
    private String department;
    private String position;

    private Integer month;
    private Integer year;

    private Double baseSalary;
    private Double grossSalary;
    
    private Double taxAmount; // PIT (Thuế TNCN)
    private Double insuranceAmount; // BHXH, BHYT, BHTN
    
    private Double totalDeductions;
    private Double netSalary;
}
