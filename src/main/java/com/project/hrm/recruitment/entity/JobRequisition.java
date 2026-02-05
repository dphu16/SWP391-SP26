package com.project.hrm.recruitment.entity;

import com.project.hrm.recruitment.enums.JobStatus;
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
@Table(name = "job_requisitions")
public class JobRequisition {

    @Id
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "req_id", nullable = false)
    private UUID id;

    @Size(max = 100)
    @NotNull
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @ColumnDefault("1")
    @Column(name = "quantity")
    private Integer quantity;

    @NotNull
    @Enumerated(EnumType.STRING)
    @ColumnDefault("'OPEN'")
    @Column(name = "status", length = 20)
    private JobStatus status;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
