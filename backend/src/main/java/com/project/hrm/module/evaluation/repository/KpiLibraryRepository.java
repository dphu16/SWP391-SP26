package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.KpiLibrary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface KpiLibraryRepository extends JpaRepository<KpiLibrary, UUID> {
}