package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.InsuranceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface InsuranceConfigRepository extends JpaRepository<InsuranceConfig, UUID> {

    @Query("""
        SELECT i FROM InsuranceConfig i
        WHERE i.insuranceCode = :code
          AND i.effectiveFrom <= :date
          AND (i.effectiveTo IS NULL OR i.effectiveTo >= :date)
        ORDER BY i.effectiveFrom DESC
        LIMIT 1
    """)
    Optional<InsuranceConfig> findActiveByCodeAndDate(@Param("code") String code, @Param("date") LocalDate date);
}
