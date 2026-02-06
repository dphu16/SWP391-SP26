package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PositionRepository extends JpaRepository<Position, UUID> {
}
