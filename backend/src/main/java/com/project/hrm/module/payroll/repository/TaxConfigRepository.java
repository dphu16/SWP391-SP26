package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.TaxConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxConfigRepository extends JpaRepository<TaxConfig, UUID> {

    @Query("SELECT t FROM TaxConfig t WHERE t.taxCode = :code " +
            "AND t.effectiveFrom <= :calcDate " +
            "AND (t.effectiveTo IS NULL OR t.effectiveTo >= :calcDate)")
    Optional<TaxConfig> findActiveConfig(@Param("code") String code, @Param("calcDate") LocalDate calcDate);
}
