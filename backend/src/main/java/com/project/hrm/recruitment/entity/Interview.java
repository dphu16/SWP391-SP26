package com.project.hrm.recruitment.entity;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.recruitment.enums.InterviewStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id")
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id")
    private Employee interviewer;

    @Column(name = "schedule_time")
    private OffsetDateTime scheduleTime;

    @NotNull
    @Enumerated(EnumType.STRING)
    @ColumnDefault("'SCHEDULED'")
    @Column(name = "status", length = 20)
    private InterviewStatus status;

    @Column(name = "feedback", length = Integer.MAX_VALUE)
    private String feedback;

    @Column(name = "rating", precision = 4, scale = 2)
    private BigDecimal rating;
}
