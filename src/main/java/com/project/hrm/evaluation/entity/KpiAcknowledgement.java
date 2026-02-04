package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "kpi_acknowledgements")
@Data
public class KpiAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ackId;

    private Long goalId;
    private Long employeeId;
    private String status;
    private String rejectReason;
    private LocalDateTime confirmedAt;
}

