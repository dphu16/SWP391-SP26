package com.project.hrm.module.payroll.repository;



import com.project.hrm.module.payroll.entity.SalaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface SalaryProfileRepository extends JpaRepository<SalaryProfile, UUID> {

    // Tìm Salary Profile có hiệu lực tại thời điểm tính lương
    // Logic: effective_from <= ngày cuối tháng VÀ (effective_to NULL hoặc >= ngày đầu tháng)
    @Query("SELECT s FROM SalaryProfile s " +
            "WHERE s.employee.employeeId = :employeeId " +
            "AND s.effectiveFrom <= :endDate " +
            "AND (s.effectiveTo IS NULL OR s.effectiveTo >= :startDate) " +
            "ORDER BY s.effectiveFrom DESC LIMIT 1")
    Optional<SalaryProfile> findActiveProfileForPeriod(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
