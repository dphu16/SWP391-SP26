package com.project.hrm.payroll.compensation.entity;


import com.project.hrm.payroll.common.enums.PeriodStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "payroll_periods",
        uniqueConstraints = @UniqueConstraint(columnNames = {"month", "year"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollPeriods {
    @Id
    @GeneratedValue
    @Column(name = "period_id")
    private UUID periodId;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PeriodStatus status;

    private OffsetDateTime createAt;

    private OffsetDateTime updateAt;
}
