package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.SalaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface SalaryProfileRepository extends JpaRepository<SalaryProfile, UUID> {

    /** Lấy hồ sơ lương đang có hiệu lực tại một ngày cụ thể */
    @Query("""
        SELECT sp FROM SalaryProfile sp
        WHERE sp.employee.employeeId = :employeeId
          AND sp.effectiveFrom <= :date
          AND (sp.effectiveTo IS NULL OR sp.effectiveTo >= :date)
        ORDER BY sp.effectiveFrom DESC
        LIMIT 1
    """)
    Optional<SalaryProfile> findActiveByEmployeeIdAndDate(
            @Param("employeeId") UUID employeeId,
            @Param("date") LocalDate date
    );
}
