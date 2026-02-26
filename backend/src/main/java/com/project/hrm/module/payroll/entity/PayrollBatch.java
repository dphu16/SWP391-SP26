package com.project.hrm.module.payroll.entity;


import com.project.hrm.module.payroll.enums.BatchStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payroll_batches", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayrollBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "batch_id")
    private UUID batchId;

    @Column(nullable = false)
    private LocalDate period; // Ngày đầu tháng

    @Enumerated(EnumType.STRING)
    private BatchStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;
}
