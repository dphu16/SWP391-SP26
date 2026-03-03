package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, UUID> {
    List<PaymentRequest> findByStatusOrderByCreatedAtDesc(String status);
}
