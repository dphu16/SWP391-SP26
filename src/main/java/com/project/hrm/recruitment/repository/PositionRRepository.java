package com.project.hrm.recruitment.repository;

import com.project.hrm.module.corehr.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PositionRRepository extends JpaRepository<Position, UUID> {
    Optional<Position> findPositionByPositionId(UUID positionId);
}
