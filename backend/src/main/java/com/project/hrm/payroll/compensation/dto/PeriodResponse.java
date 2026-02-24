package com.project.hrm.payroll.compensation.dto;

import com.project.hrm.payroll.common.enums.PeriodStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class PeriodResponse {
    private UUID id;
    private Integer month;
    private Integer year;
    private LocalDate startDate;
    private LocalDate endDate;
    private PeriodStatus periodStatus;
}
