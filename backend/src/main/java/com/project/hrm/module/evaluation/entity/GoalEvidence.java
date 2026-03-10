package com.project.hrm.module.evaluation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.hrm.module.evaluation.enums.EvidenceStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "goal_evidences")
@Data
public class GoalEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "evidence_id")
    private UUID evidenceId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private EmployeeGoal goal;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EvidenceStatus status = EvidenceStatus.PENDING;

    @Column(name = "mentor_comment")
    private String mentorComment;

    @CreationTimestamp
    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
}
