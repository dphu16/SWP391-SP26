package com.project.hrm.payroll.dto;

import lombok.Data;

@Data
public class PayslipDTO {

    private Long id;
    private Long employeeId;
    private Double basicSalary;
    private Double tax;
    private Double netSalary;
}
