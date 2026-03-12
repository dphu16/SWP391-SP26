package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.enums.PayrollBatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayrollBatchRepository extends JpaRepository<PayrollBatch, UUID> {

    Optional<PayrollBatch> findByPeriod_PeriodId(UUID periodId);

    List<PayrollBatch> findAllByStatus(PayrollBatchStatus status);
}
