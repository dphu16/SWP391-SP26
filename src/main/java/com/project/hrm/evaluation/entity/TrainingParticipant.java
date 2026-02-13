package com.project.hrm.evaluation.entity;


import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;

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
    @JoinColumn(name = "session_id", nullable = false)
    private TrainingSession session;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "attendance_status")
    private String attendanceStatus;
}
