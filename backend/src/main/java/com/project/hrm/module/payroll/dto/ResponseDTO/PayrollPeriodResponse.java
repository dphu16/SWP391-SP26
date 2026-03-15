package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.enums.PayrollPeriodStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PayrollPeriodResponse {
    private UUID periodId;
    private UUID batchId;
    private Integer month;
    private Integer year;
    private LocalDate startDate;
    private LocalDate endDate;
    private PayrollPeriodStatus status;
    private com.project.hrm.module.payroll.enums.PayrollBatchStatus batchStatus;
    private OffsetDateTime createdAt;
}
