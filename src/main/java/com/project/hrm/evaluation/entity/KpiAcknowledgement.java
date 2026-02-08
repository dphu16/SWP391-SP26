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
    private UUID ackId;

    @ManyToOne
    @JoinColumn(name = "goal_id")
    private EmployeeGoal  goalId;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employeeId;

    @Column(name = "is_confirmed")
    private Boolean status = false;

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

}

