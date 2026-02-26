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
@Table(name = "interviews")
public class Interview {
    @Id
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "interview_id", nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id", nullable = false)
    private Application app;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id")
    private Employee interviewer;

    @Column(name = "schedule_time")
    private OffsetDateTime scheduleTime;

    @Size(max = 20)
    @ColumnDefault("'SCHEDULED'")
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "feedback", length = Integer.MAX_VALUE)
    private String feedback;


}