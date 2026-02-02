package com.project.hrm.payroll.repository;

import com.project.hrm.payroll.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
}
