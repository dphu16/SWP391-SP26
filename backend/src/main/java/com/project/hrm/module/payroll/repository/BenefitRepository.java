package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.Benefit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BenefitRepository extends JpaRepository<Benefit, UUID> {
    Page<Benefit> findByIsActive(Boolean isActive, Pageable pageable);
}
