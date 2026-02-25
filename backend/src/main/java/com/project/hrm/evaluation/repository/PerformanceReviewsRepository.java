package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.PerformanceReviews;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PerformanceReviewsRepository extends JpaRepository<PerformanceReviews, UUID> {

    List<PerformanceReviews> findByEmployee_EmployeeId(UUID employeeId);

    java.util.Optional<PerformanceReviews> findByEmployee_EmployeeIdAndCycle_CycleId(UUID employeeId, UUID cycleId);
}