package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.DisciplinaryActions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DisciplinaryActionsRepository extends JpaRepository<DisciplinaryActions, UUID> {
}

