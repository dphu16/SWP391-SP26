package com.project.hrm.recruitment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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

    @Size(max = 20)
    @ColumnDefault("'OPEN'")
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;


}