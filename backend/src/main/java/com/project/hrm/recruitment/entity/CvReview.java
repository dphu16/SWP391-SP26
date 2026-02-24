package com.project.hrm.recruitment.entity;

import com.project.hrm.recruitment.enums.ReviewResult;
import jakarta.persistence.*;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id")
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private Employee reviewer;

    @Column(name = "score", precision = 4, scale = 2)
    private BigDecimal score;

    @Column(name = "comment", length = Integer.MAX_VALUE)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 20)
    private ReviewResult result;

    @ColumnDefault("now()")
    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;
}
