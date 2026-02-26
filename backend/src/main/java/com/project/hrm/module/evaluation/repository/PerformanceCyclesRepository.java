package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PerformanceCyclesRepository
        extends JpaRepository<PerformanceCycles, UUID> {
}