package com.project.hrm.payroll.payment.repository;

import com.project.hrm.payroll.payment.entity.PayrollPeriod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PayrollPeriodRepository
        extends JpaRepository<PayrollPeriod, UUID> {

    Optional<PayrollPeriod> findByMonthAndYear(Integer month, Integer year);
}
