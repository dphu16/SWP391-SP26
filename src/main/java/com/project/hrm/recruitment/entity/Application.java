package com.project.hrm.recruitment.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "applications")
public class Application {
    @Id
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "app_id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "req_id")
    private JobRequisition req;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    @Size(max = 30)
    @ColumnDefault("'APPLIED'")
    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "ai_match_score", precision = 5, scale = 2)
    private BigDecimal aiMatchScore;

    @ColumnDefault("now()")
    @Column(name = "applied_at")
    private OffsetDateTime appliedAt;


}