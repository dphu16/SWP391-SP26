package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.TaxConfig;
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
          AND t.effectiveFrom <= :date
          AND (t.effectiveTo IS NULL OR t.effectiveTo >= :date)
        ORDER BY t.effectiveFrom DESC
        LIMIT 1
    """)
    Optional<TaxConfig> findActiveByCodeAndDate(@Param("code") String code, @Param("date") LocalDate date);
}
