package com.project.hrm.payroll.payment.repository;

import com.project.hrm.payroll.payment.entity.PaymentBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PaymentBatchRepository
        extends JpaRepository<PaymentBatch, UUID> {
}
