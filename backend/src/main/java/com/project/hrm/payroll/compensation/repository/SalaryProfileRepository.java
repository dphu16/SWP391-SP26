package com.project.hrm.payroll.compensation.repository;

import com.project.hrm.payroll.compensation.entity.SalaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface SalaryProfileRepository extends JpaRepository<SalaryProfile, UUID> {
    Optional<SalaryProfile> findByEmployeeIdAndEffectiveToIsNull(UUID employeeId);

    @Query("""
        SELECT sp FROM SalaryProfile sp
        WHERE sp.employeeId = :employeeId
        AND :date BETWEEN sp.effectiveFrom
                      AND COALESCE(sp.effectiveTo, :date)
    """)

    Optional<SalaryProfile> findByEmployeeIdAtDate(UUID employeeId, LocalDate date);
}
