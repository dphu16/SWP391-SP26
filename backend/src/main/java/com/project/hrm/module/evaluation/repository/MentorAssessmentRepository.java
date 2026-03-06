package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.MentorAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MentorAssessmentRepository extends JpaRepository<MentorAssessment, UUID> {
    Optional<MentorAssessment> findByReview_ReviewId(UUID reviewId);
    Optional<MentorAssessment> findByReview_Employee_EmployeeIdAndReview_Cycle_CycleId(UUID employeeId, UUID cycleId);
}
