package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PayrollPeriod;
import com.project.hrm.module.payroll.enums.PayrollPeriodStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, UUID> {

    boolean existsByMonthAndYear(int month, int year);

    Optional<PayrollPeriod> findByMonthAndYear(int month, int year);

    List<PayrollPeriod> findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus status);

    /** Lấy kỳ lương gần nhất (mới nhất theo năm/tháng) */
    Optional<PayrollPeriod> findTopByOrderByYearDescMonthDesc();
}