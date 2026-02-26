package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import com.project.hrm.module.evaluation.enums.CycleStatus;

public interface PerformanceCyclesRepository
        extends JpaRepository<PerformanceCycles, UUID> {
    Optional<PerformanceCycles> findFirstByStatusOrderByCreatedAtDesc(CycleStatus status);
}