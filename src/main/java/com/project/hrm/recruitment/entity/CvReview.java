package com.project.hrm.recruitment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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

    @Column(name = "score", precision = 4, scale = 2)
    private BigDecimal score;

    @Column(name = "comment", length = Integer.MAX_VALUE)
    private String comment;

    @Size(max = 20)
    @Column(name = "result", length = 20)
    private String result;

    @ColumnDefault("now()")
    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;


}