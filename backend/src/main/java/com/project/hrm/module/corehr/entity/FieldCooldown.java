package com.project.hrm.module.corehr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "field_cooldowns", indexes = {
        @Index(name = "idx_cooldown_employee_field", columnList = "employee_id, field_name")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldCooldown {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "cooldown_id")
    private UUID cooldownId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "field_name", nullable = false, length = 50)
    private String fieldName;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "cooldown_until", nullable = false)
    private LocalDateTime cooldownUntil;
}
