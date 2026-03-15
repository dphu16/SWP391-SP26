package com.project.hrm.module.corehr.entity;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private OffboardingType type;

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Column(name = "expected_last_day")
    private LocalDate expectedLastDay;

    /** Ngày nghỉ chính thức do HR điền */
    @Column(name = "official_last_day")
    private LocalDate officialLastDay;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private OffboardingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_employee_status", length = 30)
    private EmployeeStatus previousEmployeeStatus;

    /** Người tạo request (UUID nhân viên hoặc quản lý) */
    @Column(name = "requested_by")
    private UUID requestedBy;

    /** Quản lý duyệt */
    @Column(name = "approved_by_manager")
    private UUID approvedByManager;

    @Column(name = "manager_approved_date")
    private LocalDate managerApprovedDate;

    /** HR xác nhận */
    @Column(name = "confirmed_by_hr")
    private UUID confirmedByHr;

    @Column(name = "hr_confirmed_date")
    private LocalDate hrConfirmedDate;

    /** Hủy yêu cầu */
    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @Column(name = "cancelled_date")
    private LocalDate cancelledDate;

    @Column(name = "final_settlement_amount", precision = 15, scale = 2)
    private BigDecimal finalSettlementAmount;

    @Column(name = "is_finance_cleared")
    private Boolean isFinanceCleared;

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
