package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.PerformanceRuleResults;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PerformanceRuleResultsRepository extends JpaRepository<PerformanceRuleResults, UUID> {

}

