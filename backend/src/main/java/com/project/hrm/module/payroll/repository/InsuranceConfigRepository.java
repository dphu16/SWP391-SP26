package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.InsuranceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InsuranceConfigRepository extends JpaRepository<InsuranceConfig, UUID> {

    @Query("SELECT i FROM InsuranceConfig i WHERE i.insuranceCode = :code " +
            "AND i.effectiveFrom <= :calcDate " +
            "AND (i.effectiveTo IS NULL OR i.effectiveTo >= :calcDate)")
    Optional<InsuranceConfig> findActiveConfig(@Param("code") String code, @Param("calcDate") LocalDate calcDate);
}
