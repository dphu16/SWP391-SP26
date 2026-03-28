package com.project.hrm.module.payroll.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.dto.RequestDTO.CreatePaymentRequestRequest;
import com.project.hrm.module.payroll.dto.RequestDTO.ReviewPaymentRequestRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentRequestResponse;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.*;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final PayrollBatchRepository payrollBatchRepository;
    private final FinanceAccountRepository financeAccountRepository;
    private final PayslipRepository payslipRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;

    @Transactional
    public PaymentRequestResponse createRequest(UUID requesterId, CreatePaymentRequestRequest request) {
        PayrollBatch batch = payrollBatchRepository.findById(request.getPayrollBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Batch không tồn tại."));

        if (batch.getStatus() != PayrollBatchStatus.VALIDATED &&
                batch.getStatus() != PayrollBatchStatus.PROCESSED &&
                batch.getStatus() != PayrollBatchStatus.LOCKED) {
            throw new PayrollException(
                    "Batch phải ở trạng thái VALIDATED, PROCESSED hoặc LOCKED trước khi thực hiện hành động này.");
        }

        FinanceAccount sourceAccount = financeAccountRepository.findById(request.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        if (!"ACTIVE".equals(sourceAccount.getStatus())) {
            throw new PayrollException("Tài khoản nguồn không ở trạng thái ACTIVE.");
        }

        // Tính toán số tiền dựa trên loại yêu cầu
        BigDecimal totalAmount;
        if (request.getType() == PaymentRequestType.TAX_INSURANCE) {
            // [RULE] Chỉ block nếu đang có request TAX_INSURANCE đang PENDING hoặc đã PAID.
            // Không block nếu request cũ đã REJECTED (cho phép gửi lại sau khi Finance từ chối).
            boolean hasActiveRequest = paymentRequestRepository
                    .existsByPayrollBatch_BatchIdAndTypeAndStatusIn(
                            batch.getBatchId(),
                            PaymentRequestType.TAX_INSURANCE,
                            List.of(PaymentRequestStatus.PENDING, PaymentRequestStatus.PAID));
            if (hasActiveRequest) {
                throw new PayrollException(
                        "Báo cáo Thuế & Bảo hiểm cho kỳ lương này đang chờ Finance duyệt (PENDING) hoặc đã được thanh toán (PAID). Không thể gửi lại.");
            }

            BigDecimal pit = payslipRepository.sumTaxAmountByBatchId(batch.getBatchId());
            BigDecimal ins = payslipRepository.sumInsuranceAmountByBatchId(batch.getBatchId());
            totalAmount = pit.add(ins);
        } else {
            // [RULE] Chỉ 1 SALARY request được phép tồn tại ở trạng thái PENDING hoặc PAID trên mỗi batch.
            // PENDING = đang chờ Finance duyệt → không cho gửi thêm.
            // PAID = đã thanh toán → không cho gửi lại.
            // REJECTED = Finance từ chối → HR được phép gửi lại.
            boolean hasActiveSalaryRequest = paymentRequestRepository
                    .existsByPayrollBatch_BatchIdAndTypeAndStatusIn(
                            batch.getBatchId(),
                            PaymentRequestType.SALARY,
                            List.of(PaymentRequestStatus.PENDING, PaymentRequestStatus.PAID));
            if (hasActiveSalaryRequest) {
                throw new PayrollException(
                        "Yêu cầu chi lương cho kỳ này đang chờ Finance duyệt (PENDING) hoặc đã được thanh toán (PAID). Không thể gửi thêm.");
            }
            totalAmount = payslipRepository.sumNetSalaryByBatchId(batch.getBatchId());
        }

        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            throw new PayrollException("Không có dữ liệu số tiền (hoặc phí) đã CONFIRMED trong batch này.");
        }

        // [RULE] Kiểm tra số dư tài khoản đủ không
        if (sourceAccount.getCurrentBalance().compareTo(totalAmount) < 0) {
            throw new PayrollException(
                    "Số dư tài khoản không đủ. Cần: " + totalAmount + ", Hiện có: "
                            + sourceAccount.getCurrentBalance());
        }

        Employee requester = new Employee();
        requester.setEmployeeId(requesterId);

        PaymentRequest paymentRequest = PaymentRequest.builder()
                .payrollBatch(batch)
                .requester(requester)
                .sourceAccount(sourceAccount)
                .totalAmountRequested(totalAmount)
                .reportUrl(request.getReportUrl())
                .hrNote(request.getHrNote())
                .type(request.getType())
                .status(PaymentRequestStatus.PENDING)
                .build();

        paymentRequest = paymentRequestRepository.save(paymentRequest);

        // [RULE] Nếu là yêu cầu chi LƯƠNG -> Chuyển trạng thái Batch sang PROCESSED
        // Đồng thời, tự động reject bất kỳ TAX_INSURANCE đang PENDING cho cùng batch này.
        // Ý nghĩa: HR phải gửi lại báo cáo Thuế & Bảo hiểm mới cho kỳ này — dữ liệu bảng lương có thể đã thay đổi.
        if (request.getType() == PaymentRequestType.SALARY) {
            batch.setStatus(PayrollBatchStatus.PROCESSED);
            payrollBatchRepository.save(batch);

            List<PaymentRequest> pendingTaxRequests = paymentRequestRepository
                    .findAllByPayrollBatch_BatchIdAndTypeAndStatus(
                            batch.getBatchId(),
                            PaymentRequestType.TAX_INSURANCE,
                            PaymentRequestStatus.PENDING);
            if (!pendingTaxRequests.isEmpty()) {
                pendingTaxRequests.forEach(req -> {
                    req.setStatus(PaymentRequestStatus.REJECTED);
                    req.setFinanceNote(
                            "Tự động hủy: bảng lương được gửi lại. HR cần nộp lại báo cáo Thuế & Bảo hiểm mới.");
                });
                paymentRequestRepository.saveAll(pendingTaxRequests);
            }
        }

        return toResponse(paymentRequest);
    }

    /**
     * Finance: Duyệt hoặc từ chối yêu cầu thanh toán.
     */
    @Transactional
    public PaymentRequestResponse reviewRequest(UUID approverId, UUID requestId,
            ReviewPaymentRequestRequest request) {
        PaymentRequest paymentRequest = findOrThrow(requestId);

        if (paymentRequest.getStatus() != PaymentRequestStatus.PENDING) {
            throw new PayrollException("Yêu cầu này đã được xử lý rồi.");
        }

        Employee approver = new Employee();
        approver.setEmployeeId(approverId);
        paymentRequest.setApprover(approver);
        paymentRequest.setFinanceNote(request.getFinanceNote());

        if (Boolean.TRUE.equals(request.getApproved())) {
            // 1. Khấu trừ tiền từ tài khoản nguồn
            FinanceAccount sourceAccount = paymentRequest.getSourceAccount();
            BigDecimal amount = paymentRequest.getTotalAmountRequested();
            if (sourceAccount.getCurrentBalance().compareTo(amount) < 0) {
                throw new PayrollException("Số dư tài khoản không đủ để thực hiện thanh toán này.");
            }
            sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
            financeAccountRepository.save(sourceAccount);

            // 2. Cập nhật trạng thái yêu cầu sang PAID (Đã chi trả)
            paymentRequest.setStatus(PaymentRequestStatus.PAID);
            paymentRequest.setApprovedAt(OffsetDateTime.now());

            // 3. Nếu là yêu cầu chi LƯƠNG -> Chốt toàn bộ phiếu lương sang PAID
            if (paymentRequest.getType() == PaymentRequestType.SALARY) {
                List<Payslip> payslips = payslipRepository
                        .findAllByBatch_BatchId(paymentRequest.getPayrollBatch().getBatchId());
                for (Payslip p : payslips) {
                    if (p.getStatus() == PayslipStatus.CONFIRMED) {
                        p.setStatus(PayslipStatus.PAID);
                        p.setPaidAt(OffsetDateTime.now());
                    }
                }
                payslipRepository.saveAll(payslips);

                // 4. Batch cũng nên được khóa (LOCKED) sau khi đã chi trả lương
                PayrollBatch batch = paymentRequest.getPayrollBatch();
                batch.setStatus(PayrollBatchStatus.LOCKED);
                payrollBatchRepository.save(batch);

                // 5. Đồng bộ trạng thái Kỳ lương (Period) sang PAID
                PayrollPeriod period = batch.getPeriod();
                period.setStatus(PayrollPeriodStatus.PAID);
                payrollPeriodRepository.save(period);
            }
        } else {
            // Finance từ chối yêu cầu thanh toán
            paymentRequest.setStatus(PaymentRequestStatus.REJECTED);

            // Nếu là yêu cầu chi LƯƠNG bị từ chối → rollback để HR kiểm tra và chỉnh sửa lại
            if (paymentRequest.getType() == PaymentRequestType.SALARY) {
                PayrollBatch batch = paymentRequest.getPayrollBatch();

                // 1. Đưa tất cả payslip CONFIRMED về lại DRAFT để HR có thể chỉnh sửa
                List<Payslip> payslips = payslipRepository.findAllByBatch_BatchId(batch.getBatchId());
                for (Payslip p : payslips) {
                    if (p.getStatus() == PayslipStatus.CONFIRMED) {
                        p.setStatus(PayslipStatus.DRAFT);
                        p.setConfirmedAt(null);
                    }
                }
                payslipRepository.saveAll(payslips);

                // 2. Đưa Batch về lại DRAFT (HR cần confirm lại sau khi chỉnh sửa)
                batch.setStatus(PayrollBatchStatus.DRAFT);
                payrollBatchRepository.save(batch);

                // 3. Tự động từ chối tất cả TAX_INSURANCE request PENDING của cùng batch
                //    vì dữ liệu bảng lương đã thay đổi, HR phải nộp lại sau khi chỉnh sửa xong
                List<PaymentRequest> pendingTaxRequests = paymentRequestRepository
                        .findAllByPayrollBatch_BatchIdAndTypeAndStatus(
                                batch.getBatchId(),
                                PaymentRequestType.TAX_INSURANCE,
                                PaymentRequestStatus.PENDING);
                for (PaymentRequest taxReq : pendingTaxRequests) {
                    taxReq.setStatus(PaymentRequestStatus.REJECTED);
                    taxReq.setFinanceNote(
                            "Tự động hủy: yêu cầu chi lương bị Finance từ chối. " +
                            "HR cần chỉnh sửa bảng lương và nộp lại yêu cầu Thuế & Bảo hiểm.");
                }
                paymentRequestRepository.saveAll(pendingTaxRequests);
            }
        }

        return toResponse(paymentRequestRepository.save(paymentRequest));
    }

    /** Finance: Xem danh sách các yêu cầu PENDING */
    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getPendingRequests() {
        return paymentRequestRepository.findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Finance: Xem toàn bộ lịch sử yêu cầu (PENDING + PAID + REJECTED) */
    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getAllRequests() {
        return paymentRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** HR: Xem lịch sử các yêu cầu đã tạo */
    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getMyRequests(UUID requesterId) {
        return paymentRequestRepository.findAllByRequester_EmployeeIdOrderByCreatedAtDesc(requesterId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Lay thong tin chi tiet 1 PaymentRequest */
    @Transactional(readOnly = true)
    public PaymentRequestResponse getRequestById(UUID requestId) {
        return toResponse(findOrThrow(requestId));
    }

    private PaymentRequest findOrThrow(UUID requestId) {
        return paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu thanh toán không tồn tại: " + requestId));
    }

    private PaymentRequestResponse toResponse(PaymentRequest r) {
        return PaymentRequestResponse.builder()
                .requestId(r.getRequestId())
                .payrollBatchId(r.getPayrollBatch().getBatchId())
                .requesterId(r.getRequester().getEmployeeId())
                .requesterName(r.getRequester().getFullName())
                .sourceAccountId(r.getSourceAccount() != null ? r.getSourceAccount().getAccountId() : null)
                .sourceAccountName(r.getSourceAccount() != null ? r.getSourceAccount().getAccountName() : null)
                .totalAmountRequested(r.getTotalAmountRequested())
                .status(r.getStatus())
                .type(r.getType())
                .hrNote(r.getHrNote())
                .financeNote(r.getFinanceNote())
                .reportUrl(r.getReportUrl())
                .approvedAt(r.getApprovedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
