package com.project.hrm.recruitment.entity;

import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "jobs")
public class Job {
    @Id
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "job_id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private JobRequest request;

    @Size(max = 100)
    @NotNull
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @NotNull
    @Column(name = "description", nullable = false, length = Integer.MAX_VALUE)
    private String description;

    @NotNull
    @Column(name = "responsibilities", nullable = false, length = Integer.MAX_VALUE)
    private String responsibilities;

    @NotNull
    @Column(name = "requirements", nullable = false, length = Integer.MAX_VALUE)
    private String requirements;

    @Column(name = "benefits", length = Integer.MAX_VALUE)
    private String benefits;

    @ColumnDefault("1")
    @Column(name = "quantity")
    private Integer quantity;

    @Size(max = 20)
    @ColumnDefault("'OPEN'")
    @Column(name = "status", length = 20)
    private String status;

    @ColumnDefault("now()")
    @Column(name = "posted_at")
    private OffsetDateTime postedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hr_id")
    private Employee employee;


}