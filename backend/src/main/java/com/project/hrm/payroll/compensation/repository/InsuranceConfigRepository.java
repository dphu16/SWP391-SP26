package com.project.hrm.payroll.compensation.repository;

import com.project.hrm.payroll.compensation.entity.InsuranceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface InsuranceConfigRepository extends JpaRepository<InsuranceConfig, UUID> {
    @Query("""
    SELECT i FROM InsuranceConfig i
    WHERE i.insuranceCode = :code
    AND i.effectiveFrom <= :periodEnd
    AND (i.effectiveTo IS NULL OR i.effectiveTo >= :periodStart)
""")
    Optional<InsuranceConfig> findActiveInsurance(
            String code,
            LocalDate periodStart,
            LocalDate periodEnd
    );
}
