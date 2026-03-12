package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PaymentRequest;
import com.project.hrm.module.payroll.enums.PaymentRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, UUID> {

    List<PaymentRequest> findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus status);

    List<PaymentRequest> findAllByRequester_EmployeeIdOrderByCreatedAtDesc(UUID requesterId);

    boolean existsByPayrollBatch_BatchIdAndType(UUID batchId, com.project.hrm.module.payroll.enums.PaymentRequestType type);
}
