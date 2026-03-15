package com.project.hrm.module.recruitment.entity;

import com.project.hrm.module.recruitment.enums.EmploymentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.annotations.ColumnDefault;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "job_details")
public class JobDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "job_detail_id")
    private UUID jobDetailId;

    @ColumnDefault("1")
    @Column(name = "quantity")
    private Integer quantity;

    @ColumnDefault("50")
    @Column(name = "max_cv")
    private Integer maxCv;

    @NotNull
    @Column(name = "description", nullable = false, length = Integer.MAX_VALUE)
    private String description;

    @NotNull
    @Column(name = "responsibilities", nullable = false, length = Integer.MAX_VALUE)
    private String responsibilities;

    @NotNull
    @Column(name = "requirements", nullable = false, length = Integer.MAX_VALUE)
    private String requirements;

    @NotNull
    @Column(name = "benefits", length = Integer.MAX_VALUE)
    private String benefits;

    @Size(max = 150)
    @NotNull
    @Column(name = "location", nullable = false, length = 150)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private EmploymentType type;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
