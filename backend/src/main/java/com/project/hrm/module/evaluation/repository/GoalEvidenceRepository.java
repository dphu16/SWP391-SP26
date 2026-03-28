package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.GoalEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalEvidenceRepository extends JpaRepository<GoalEvidence, UUID> {
    List<GoalEvidence> findByGoal_GoalId(UUID goalId);
}
