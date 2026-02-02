package com.project.hrm.payroll.dto;

import lombok.Data;

@Data
public class PayrollDTO {
    private Long id;
    private Integer month;
    private Integer year;
    private Double totalSalary;
    private String status;
}
