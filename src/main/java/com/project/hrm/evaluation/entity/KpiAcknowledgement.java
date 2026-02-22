package com.project.hrm.evaluation.entity;

import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "kpi_acknowledgements")
@Data
public class KpiAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ack_id")
    private UUID ackId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private EmployeeGoal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "is_confirmed", nullable = false)
    private Boolean confirmed = false;

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;
}


