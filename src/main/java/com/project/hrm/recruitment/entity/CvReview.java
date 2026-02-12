package com.project.hrm.recruitment.entity;

import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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
@Table(name = "cv_reviews")
public class CvReview {
    @Id
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "review_id", nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id", nullable = false)
    private Application app;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private Employee reviewer;

    @Column(name = "ai_score", precision = 5, scale = 2)
    private BigDecimal aiScore;

    @Column(name = "interview_score", precision = 4, scale = 2)
    private BigDecimal interviewScore;

    @Column(name = "comment", length = Integer.MAX_VALUE)
    private String comment;

    @Size(max = 20)
    @Column(name = "result", length = 20)
    private String result;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;


}