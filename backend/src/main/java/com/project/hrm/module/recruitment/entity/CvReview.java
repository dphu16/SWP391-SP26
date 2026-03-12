package com.project.hrm.module.recruitment.entity;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.enums.ResultStatus;
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
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @Column(name = "comment", length = Integer.MAX_VALUE)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false)
    private ResultStatus result = ResultStatus.FAILED;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;


}