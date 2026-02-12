package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.PerformanceRules;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PerformanceRulesRepository extends JpaRepository<PerformanceRules, UUID> {

}

