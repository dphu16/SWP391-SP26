package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PositionRepository extends JpaRepository<Position, UUID> {

}