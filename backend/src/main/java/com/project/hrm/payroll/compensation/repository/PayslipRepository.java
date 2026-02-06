package com.project.hrm.payroll.compensation.repository;

import com.project.hrm.payroll.compensation.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {
    Optional<Payslip> findByEmployeeIdAndPeriodId(UUID employeeId, UUID periodId);
}

