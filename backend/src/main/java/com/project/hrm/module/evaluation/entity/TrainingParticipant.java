package com.project.hrm.module.evaluation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "training_participants")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TrainingParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "participant_id")
    private UUID participantId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    public String getEmployeeName() {
        return employee != null ? employee.getFullName() : null;
    }

    public UUID getEmployeeId() {
        return employee != null ? employee.getEmployeeId() : null;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private TrainingCourse course;

    @Column(name = "status", length = 20)
    private String status = "REGISTERED";

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private PerformanceReviews review;

    @Column(name = "certificate_url")
    private String certificateUrl;

    @Column(name = "certificate_submitted_at")
    private OffsetDateTime certificateSubmittedAt;

    @Column(name = "hr_confirmed_at")
    private OffsetDateTime hrConfirmedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private Employee confirmedBy;

    public UUID getConfirmedById() {
        return confirmedBy != null ? confirmedBy.getEmployeeId() : null;
    }

    public String getConfirmedByName() {
        return confirmedBy != null ? confirmedBy.getFullName() : null;
    }
}
