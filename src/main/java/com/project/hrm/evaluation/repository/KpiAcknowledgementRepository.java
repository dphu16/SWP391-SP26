package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface KpiAcknowledgementRepository
        extends JpaRepository<KpiAcknowledgement, UUID> {

    boolean existsByGoal(EmployeeGoal goal);
}

