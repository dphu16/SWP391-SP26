package com.project.hrm.payroll.compensation.repository;

import com.project.hrm.payroll.compensation.entity.TaxConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface TaxConfigRepository extends JpaRepository<TaxConfig, UUID> {

    @Query("""
        SELECT t FROM TaxConfig t
        WHERE t.taxCode = :code
        AND t.effectiveFrom <= :periodEnd
        AND (t.effectiveTo IS NULL OR t.effectiveTo >= :periodStart)
    """)
    Optional<TaxConfig> findActiveTax(
            @Param("code") String code,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd
    );
}