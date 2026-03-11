package com.project.hrm.module.corehr.entity;

import com.project.hrm.module.corehr.enums.PersonnelChangeStatus;
import com.project.hrm.module.corehr.enums.PersonnelChangeType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "personnel_changes", indexes = {
        @Index(name = "idx_pc_employee", columnList = "employee_id"),
        @Index(name = "idx_pc_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonnelChange {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "change_id")
    private UUID changeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false)
    private PersonnelChangeType changeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PersonnelChangeStatus status;

    @Column(name = "reason")
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_values", columnDefinition = "jsonb")
    private Map<String, Object> oldValues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_values", columnDefinition = "jsonb")
    private Map<String, Object> newValues;

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    @Column(name = "manager_approved_by")
    private UUID managerApprovedBy;

    @Column(name = "manager_approved_date")
    private LocalDateTime managerApprovedDate;

    @Column(name = "hr_confirmed_by")
    private UUID hrConfirmedBy;

    @Column(name = "hr_confirmed_date")
    private LocalDateTime hrConfirmedDate;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "rejected_by")
    private UUID rejectedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = PersonnelChangeStatus.PENDING;
        }
    }
}
