package com.project.hrm.module.corehr.entity;


import com.project.hrm.module.corehr.enums.OnboardingStatus;
import com.project.hrm.module.corehr.enums.OnboardingStep;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "onboarding_workflows")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Onboarding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "workflow_id")
    private UUID workflowId;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "hr_manager_id")
    private Employee hrManager;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_step")
    private OnboardingStep currentStep = OnboardingStep.PROFILE_RECEIPT;

    @Enumerated(EnumType.STRING)
    private OnboardingStatus status = OnboardingStatus.IN_PROGRESS;

    @CreationTimestamp
    @Column(name = "start_date")
    private OffsetDateTime startDate;

    @Column(name = "completed_date")
    private OffsetDateTime completedDate;
}
