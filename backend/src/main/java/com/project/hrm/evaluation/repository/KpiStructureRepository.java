package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.KpiStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface KpiStructureRepository extends JpaRepository<KpiStructure, UUID> {
    Optional<KpiStructure> findByDepartmentId(UUID departmentId);
}
