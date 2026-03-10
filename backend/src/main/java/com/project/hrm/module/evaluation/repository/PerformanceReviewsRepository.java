package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.PerformanceReviews;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PerformanceReviewsRepository extends JpaRepository<PerformanceReviews, UUID> {

    List<PerformanceReviews> findByEmployee_EmployeeId(UUID employeeId);

    java.util.Optional<PerformanceReviews> findByEmployee_EmployeeIdAndCycle_CycleId(UUID employeeId, UUID cycleId);

    /** AVG overallScore for a team in a given cycle (ignores nulls). */
    @Query("SELECT AVG(pr.overallScore) FROM PerformanceReviews pr " +
           "WHERE pr.employee.employeeId IN :employeeIds " +
           "AND pr.cycle.cycleId = :cycleId " +
           "AND pr.overallScore IS NOT NULL")
    Double avgOverallScoreByTeamAndCycle(
            @Param("employeeIds") List<UUID> employeeIds,
            @Param("cycleId") UUID cycleId);

    @Query("SELECT AVG(pr.overallScore) FROM PerformanceReviews pr " +
           "WHERE pr.cycle.cycleId = :cycleId " +
           "AND pr.overallScore IS NOT NULL " +
           "GROUP BY pr.employee.department.deptId")
    List<Double> findDepartmentAveragesByCycle(@Param("cycleId") UUID cycleId);
}
