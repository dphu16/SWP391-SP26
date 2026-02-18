package com.project.hrm.module.corehr.entity;

import com.project.hrm.module.corehr.enums.OffboardingStatus;
import com.project.hrm.module.corehr.enums.OffboardingType;
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
@Builder
public class Offboarding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "offboarding_id")
    private UUID offboardingId;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private OffboardingType type;

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Column(name = "expected_last_day")
    private LocalDate expectedLastDay;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OffboardingStatus status;

    @Column(name = "final_settlement_amount", precision = 15, scale = 2)
    private BigDecimal finalSettlementAmount;

    @Column(name = "is_finance_cleared")
    private Boolean isFinanceCleared;

    /**
     * Gán giá trị mặc định trước khi persist vào DB.
     * Dùng @PrePersist thay vì field initializer để tránh vấn đề khi dùng Builder.
     */
    @PrePersist
    protected void onCreate() {
        if (this.requestDate == null) {
            this.requestDate = LocalDate.now();
        }
        if (this.status == null) {
            this.status = OffboardingStatus.PENDING;
        }
        if (this.isFinanceCleared == null) {
            this.isFinanceCleared = false;
        }
    }
}
