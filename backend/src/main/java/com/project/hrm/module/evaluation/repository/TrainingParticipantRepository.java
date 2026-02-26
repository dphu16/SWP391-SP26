package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.TrainingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TrainingParticipantRepository extends JpaRepository<TrainingParticipant, UUID> {
}

