package com.project.hrm.module.payroll.entity;



import com.project.hrm.module.payroll.enums.PayrollStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payroll_periods", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayrollPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "period_id")
    private UUID periodId;

    private Integer month;
    private Integer year;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private PayrollStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
