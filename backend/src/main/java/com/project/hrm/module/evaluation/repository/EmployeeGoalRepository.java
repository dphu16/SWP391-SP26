package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.EmployeeGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface EmployeeGoalRepository
        extends JpaRepository<EmployeeGoal, UUID> {

    List<EmployeeGoal> findByEmployee_EmployeeId(UUID employeeId);

    @Query("SELECT COUNT(DISTINCT eg.employee.employeeId) FROM EmployeeGoal eg " +
           "WHERE eg.employee.employeeId IN :employeeIds " +
           "AND eg.cycle.cycleId = :cycleId " +
           "AND eg.status = com.project.hrm.module.evaluation.enums.GoalStatus.SUBMITTED")
    long countDistinctSubmittedEmployees(
            @Param("employeeIds") List<UUID> employeeIds,
            @Param("cycleId") UUID cycleId);

    @Query("SELECT SUM(eg.targetValue) FROM EmployeeGoal eg WHERE eg.cycle.cycleId = :cycleId")
    Double sumTargetValueByCycle(@Param("cycleId") UUID cycleId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM EmployeeGoal eg WHERE eg.employee.employeeId IN :employeeIds AND eg.cycle.cycleId = :cycleId")
    void deleteByEmployee_EmployeeIdInAndCycle_CycleId(@Param("employeeIds") List<UUID> employeeIds, @Param("cycleId") UUID cycleId);
    
    Optional<EmployeeGoal> findByEmployee_EmployeeIdAndCycle_CycleIdAndKpiLibrary_LibId(
            UUID employeeId, UUID cycleId, UUID libId);

    /** Returns ALL goals (including duplicates) for dedup logic. */
    List<EmployeeGoal> findAllByEmployee_EmployeeIdAndCycle_CycleIdAndKpiLibrary_LibId(
            UUID employeeId, UUID cycleId, UUID libId);

    /** Delete goals for employees in a cycle whose KPI library is NOT in the given list. */
    @Modifying
    @Transactional
    @Query("DELETE FROM EmployeeGoal eg WHERE eg.employee.employeeId IN :employeeIds " +
           "AND eg.cycle.cycleId = :cycleId " +
           "AND eg.kpiLibrary.libId NOT IN :kpiLibIds")
    void deleteByEmployee_EmployeeIdInAndCycle_CycleIdAndKpiLibrary_LibIdNotIn(
            @Param("employeeIds") List<UUID> employeeIds,
            @Param("cycleId") UUID cycleId,
            @Param("kpiLibIds") List<UUID> kpiLibIds);
}