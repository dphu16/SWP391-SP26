package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import com.project.hrm.evaluation.service.KpiAcknowledgementService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface KpiAcknowledgementRepository extends JpaRepository<KpiAcknowledgement, UUID> {
    Optional<KpiAcknowledgement> findByGoalIdAndEmployee(UUID idGoal, UUID idEmployee);
}
