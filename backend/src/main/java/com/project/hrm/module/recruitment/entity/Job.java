package com.project.hrm.module.recruitment.entity;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.recruitment.enums.EmploymentType;
import com.project.hrm.module.recruitment.enums.JobStatus;
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
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "job_id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private JobRequest request;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private JobStatus status = JobStatus.OPEN;

    @ColumnDefault("now()")
    @Column(name = "posted_at")
    private OffsetDateTime postedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hr_id")
    private Employee employee;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "position_id", nullable = false)
    private Position pos;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_detail_id", nullable = false, unique = true)
    private JobDetail jobDetail;

}