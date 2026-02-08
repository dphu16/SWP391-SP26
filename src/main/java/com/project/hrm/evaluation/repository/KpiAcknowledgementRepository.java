package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import com.project.hrm.module.corehr.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface KpiAcknowledgementRepository
        extends JpaRepository<KpiAcknowledgement, UUID> {

    Optional<KpiAcknowledgement> findByGoalIdAndEmployeeId(
            EmployeeGoal goalId,
            Employee employeeId
    );
}

