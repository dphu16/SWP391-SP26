package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Dependent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DependentRepository extends JpaRepository<Dependent, UUID> {
}
