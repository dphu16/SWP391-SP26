package com.project.hrm.payroll.compensation.repository;

import com.project.hrm.payroll.compensation.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PayslipRepository extends JpaRepository<Payslip, UUID> {
    List<Payslip> findByEmployeeId(UUID employeeId);

    List<Payslip> findByPeriodId(UUID periodId);
}
