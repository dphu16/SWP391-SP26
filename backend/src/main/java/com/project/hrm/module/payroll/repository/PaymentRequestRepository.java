package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PaymentRequest;
import com.project.hrm.module.payroll.enums.PaymentRequestStatus;
import com.project.hrm.module.payroll.enums.PaymentRequestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, UUID> {

    List<PaymentRequest> findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus status);

    /** Toàn bộ requests, mới nhất trước — dùng cho Finance xem Request History */
    List<PaymentRequest> findAllByOrderByCreatedAtDesc();

    List<PaymentRequest> findAllByRequester_EmployeeIdOrderByCreatedAtDesc(UUID requesterId);

    boolean existsByPayrollBatch_BatchIdAndType(UUID batchId, PaymentRequestType type);

    /** Kiểm tra có request nào theo batch, type và 1 status cụ thể không */
    boolean existsByPayrollBatch_BatchIdAndTypeAndStatus(
            UUID batchId, PaymentRequestType type, PaymentRequestStatus status);

    /** Kiểm tra có request nào còn hoạt động (PENDING/PAID) theo batch và type không.
     *  Dùng để ngăn gửi lại khi đang chờ duyệt hay đã thanh toán — bỏ qua REJECTED. */
    boolean existsByPayrollBatch_BatchIdAndTypeAndStatusIn(
            UUID batchId, PaymentRequestType type, List<PaymentRequestStatus> statuses);

    /** Tìm tất cả requests theo batch, type và status — dùng để auto-reject khi SALARY bị từ chối */
    List<PaymentRequest> findAllByPayrollBatch_BatchIdAndTypeAndStatus(
            UUID batchId, PaymentRequestType type, PaymentRequestStatus status);
}
