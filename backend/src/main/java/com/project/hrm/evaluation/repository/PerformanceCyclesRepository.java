package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.PerformanceCycles;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import com.project.hrm.evaluation.enums.CycleStatus;

public interface PerformanceCyclesRepository
        extends JpaRepository<PerformanceCycles, UUID> {
    Optional<PerformanceCycles> findFirstByStatusOrderByCreatedAtDesc(CycleStatus status);
}