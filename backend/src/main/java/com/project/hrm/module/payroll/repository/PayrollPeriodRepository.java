package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PayrollPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, UUID> {
    Optional<PayrollPeriod> findByMonthAndYear(Integer month, Integer year);
}
