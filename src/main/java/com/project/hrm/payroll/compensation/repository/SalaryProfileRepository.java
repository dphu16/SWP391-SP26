package com.project.hrm.payroll.compensation.repository;

import com.project.hrm.payroll.compensation.entity.SalaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalaryProfileRepository extends JpaRepository<SalaryProfile, UUID> {
    Optional<SalaryProfile> findByEmployeeIdAndIsActiveTrue(UUID employeeId);

    Optional<SalaryProfile> findByEmployeeId(UUID employeeId);
}
