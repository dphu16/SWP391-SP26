package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.EmployeeGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface EmployeeGoalRepository
        extends JpaRepository<EmployeeGoal, UUID> {

    List<EmployeeGoal> findByEmployee_EmployeeId(UUID employeeId);
    
    Optional<EmployeeGoal> findByEmployee_EmployeeIdAndCycle_CycleIdAndKpiLibrary_LibId(
            UUID employeeId, UUID cycleId, UUID libId);
}