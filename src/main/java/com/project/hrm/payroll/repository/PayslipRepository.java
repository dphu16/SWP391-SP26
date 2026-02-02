package com.project.hrm.payroll.repository;

import com.project.hrm.payroll.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {

    List<Payslip> findByEmployeeId(Long employeeId);
}
