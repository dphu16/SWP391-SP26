package com.project.hrm.module.payroll.compensation.repository;

import com.project.hrm.module.payroll.compensation.entity.PayrollPeriods;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriods, UUID>  {
    boolean existsByMonthAndYear(Integer month, Integer year);

    Optional<PayrollPeriods>  findByMonthAndYear(Integer month, Integer year);
}
