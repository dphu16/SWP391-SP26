package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.SalaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface SalaryProfileRepository extends JpaRepository<SalaryProfile, UUID> {

    Optional<SalaryProfile> findByEmployeeIdAndEffectiveToIsNull(UUID employeeId);

    // Query 1: Tìm profile tại một ngày cụ thể (Dùng cho logic lịch sử)
    @Query("""
        SELECT sp FROM SalaryProfile sp
        WHERE sp.employeeId = :employeeId
        AND :date BETWEEN sp.effectiveFrom
                      AND COALESCE(sp.effectiveTo, :date)
    """)
    Optional<SalaryProfile> findByEmployeeIdAtDate(
            @Param("employeeId") UUID employeeId,
            @Param("date") LocalDate date
    );

    // Query 2: Tìm profile active (Dùng cho tính lương)
    @Query("""
    SELECT s FROM SalaryProfile s
    WHERE s.employeeId = :employeeId
    AND s.effectiveFrom <= :periodEnd
    AND (s.effectiveTo IS NULL OR s.effectiveTo >= :periodStart)
""")
    Optional<SalaryProfile> findActiveProfile(
            @Param("employeeId") UUID employeeId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd
    );

    @Query("""
        SELECT s FROM SalaryProfile s
        WHERE s.employeeId = :employeeId
        AND s.effectiveFrom <= :date
        AND (s.effectiveTo IS NULL OR s.effectiveTo >= :date)
    """)
    Optional<SalaryProfile> findActiveProfile(
            @Param("employeeId") UUID employeeId,
            @Param("date") LocalDate date
    );
}
