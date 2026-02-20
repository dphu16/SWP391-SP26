package com.project.hrm.module.corehr.entity;


import com.project.hrm.module.corehr.enums.OffboardingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "offboarding_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Offboarding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "offboarding_id")
    private UUID offboardingId;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "request_date")

    private LocalDate requestDate = LocalDate.now();

    @Column(name = "expected_last_day")
    private LocalDate expectedLastDay;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    private OffboardingStatus status = OffboardingStatus.PENDING;

    @Column(name = "final_settlement_amount", precision = 15, scale = 2)
    private BigDecimal finalSettlementAmount;

    @Column(name = "is_finance_cleared")
    private Boolean isFinanceCleared = false;
}
