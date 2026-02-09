package com.project.hrm.payroll.payment.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class PayrollPeriodDTO {
    private UUID periodId;
    private Integer month;
    private Integer year;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
}
