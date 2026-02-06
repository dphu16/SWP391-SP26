package com.project.hrm.evaluation.entity;


import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "training_participants")
@Data
public class TrainingParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "participant_id")
    private UUID participantId;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private TrainingSession session;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "status")
    private String status;

    @Column(name = "score")
    private BigDecimal score;
}
