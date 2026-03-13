package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.corehr.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RPositionRepository extends JpaRepository<Position, UUID> {
    List<Position> findByDepartment_DeptId(UUID deptId);
}
