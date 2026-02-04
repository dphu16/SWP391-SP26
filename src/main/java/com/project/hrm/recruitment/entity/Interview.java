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
@Table(name = "interviews")
public class Interview {
    @Id
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "interview_id", nullable = false)
    private UUID id;

    @Column(name = "schedule_time")
    private OffsetDateTime scheduleTime;

    @Size(max = 20)
    @ColumnDefault("'SCHEDULED'")
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "feedback", length = Integer.MAX_VALUE)
    private String feedback;

    @Column(name = "rating", precision = 4, scale = 2)
    private BigDecimal rating;


}