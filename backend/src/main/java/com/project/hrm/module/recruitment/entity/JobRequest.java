package com.project.hrm.module.recruitment.entity;

import com.project.hrm.module.corehr.entity.Department;
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
@Table(name = "job_requests")
public class JobRequest {
    @Id
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "request_id", nullable = false)
    private UUID id;

    @Size(max = 150)
    @NotNull
    @Column(name = "job_title", nullable = false, length = 150)
    private String jobTitle;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dept_id", nullable = false)
    private Department dept;

    @NotNull
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Size(max = 150)
    @NotNull
    @Column(name = "location", nullable = false, length = 150)
    private String location;

    @Size(max = 20)
    @NotNull
    @Column(name = "employment_type", nullable = false, length = 20)
    private String employmentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reports_to")
    private Employee reportsTo;

    @NotNull
    @Column(name = "reason", nullable = false, length = Integer.MAX_VALUE)
    private String reason;

    @Size(max = 20)
    @ColumnDefault("'SUBMITTED'")
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "hr_comment", length = Integer.MAX_VALUE)
    private String hrComment;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;


}