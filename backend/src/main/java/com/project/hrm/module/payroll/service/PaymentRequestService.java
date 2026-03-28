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
                .orElseThrow(() -> new ResourceNotFoundException("Payroll batch not found."));

        if (batch.getStatus() != PayrollBatchStatus.VALIDATED &&
                batch.getStatus() != PayrollBatchStatus.PROCESSED &&
                batch.getStatus() != PayrollBatchStatus.LOCKED) {
            throw new PayrollException(
                    "Batch must be in VALIDATED, PROCESSED, or LOCKED status before performing this action.");
        }

        FinanceAccount sourceAccount = financeAccountRepository.findById(request.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Finance account not found."));

        if (!"ACTIVE".equals(sourceAccount.getStatus())) {
            throw new PayrollException("Source account is not ACTIVE.");
        }

        // Tính toán số tiền dựa trên loại yêu cầu
        BigDecimal totalAmount;
        if (request.getType() == PaymentRequestType.TAX_INSURANCE) {
            // Không block nếu request cũ đã REJECTED (cho phép gửi lại sau khi Finance từ chối).
            boolean hasActiveRequest = paymentRequestRepository
                    .existsByPayrollBatch_BatchIdAndTypeAndStatusIn(
                            batch.getBatchId(),
                            PaymentRequestType.TAX_INSURANCE,
                            List.of(PaymentRequestStatus.PENDING, PaymentRequestStatus.PAID));
            if (hasActiveRequest) {
                throw new PayrollException(
                        "A Tax & Insurance request for this payroll period is already PENDING or PAID. Cannot resubmit.");
            }

            BigDecimal pit = payslipRepository.sumTaxAmountByBatchId(batch.getBatchId());
            BigDecimal ins = payslipRepository.sumInsuranceAmountByBatchId(batch.getBatchId());
            totalAmount = pit.add(ins);
        } else {
            boolean hasActiveSalaryRequest = paymentRequestRepository
                    .existsByPayrollBatch_BatchIdAndTypeAndStatusIn(
                            batch.getBatchId(),
                            PaymentRequestType.SALARY,
                            List.of(PaymentRequestStatus.PENDING, PaymentRequestStatus.PAID));
            if (hasActiveSalaryRequest) {
                throw new PayrollException(
                        "A salary payment request for this period is already PENDING or PAID. Cannot submit another one.");
            }
            totalAmount = payslipRepository.sumNetSalaryByBatchId(batch.getBatchId());
        }

        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            throw new PayrollException("No confirmed salary data found in this batch.");
        }

        //Kiểm tra số dư tài khoản đủ không
        if (sourceAccount.getCurrentBalance().compareTo(totalAmount) < 0) {
            throw new PayrollException(
                    "Insufficient account balance. Required: " + totalAmount + ", Available: "
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

        //HR phải gửi lại báo cáo Thuế & Bảo hiểm mới cho kỳ này — dữ liệu bảng lương có thể đã thay đổi.
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
                            "Auto-rejected: salary payroll resubmitted. HR must submit a new Tax & Insurance report.");
                });
                paymentRequestRepository.saveAll(pendingTaxRequests);
            }
        }

        return toResponse(paymentRequest);
    }


    //Finance: Duyệt hoặc từ chối yêu cầu thanh toán.
    @Transactional
    public PaymentRequestResponse reviewRequest(UUID approverId, UUID requestId,
            ReviewPaymentRequestRequest request) {
        PaymentRequest paymentRequest = findOrThrow(requestId);

        if (paymentRequest.getStatus() != PaymentRequestStatus.PENDING) {
            throw new PayrollException("This request has already been processed.");
        }

        Employee approver = new Employee();
        approver.setEmployeeId(approverId);
        paymentRequest.setApprover(approver);
        paymentRequest.setFinanceNote(request.getFinanceNote());

        if (Boolean.TRUE.equals(request.getApproved())) {
            //Khấu trừ tiền từ tài khoản nguồn
            FinanceAccount sourceAccount = paymentRequest.getSourceAccount();
            BigDecimal amount = paymentRequest.getTotalAmountRequested();
            if (sourceAccount.getCurrentBalance().compareTo(amount) < 0) {
                throw new PayrollException("Insufficient account balance to process this payment.");
            }
            sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
            financeAccountRepository.save(sourceAccount);

            //Cập nhật trạng thái yêu cầu sang PAID
            paymentRequest.setStatus(PaymentRequestStatus.PAID);
            paymentRequest.setApprovedAt(OffsetDateTime.now());

            //Nếu là yêu cầu chi LƯƠNG sau đó Chốt toàn bộ phiếu lương sang PAID
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

                //Batch cũng được(LOCKED) sau khi đã chi trả lương
                PayrollBatch batch = paymentRequest.getPayrollBatch();
                batch.setStatus(PayrollBatchStatus.LOCKED);
                payrollBatchRepository.save(batch);

                //Đồng bộ trạng thái Kỳ lương (Period) sang PAID
                PayrollPeriod period = batch.getPeriod();
                period.setStatus(PayrollPeriodStatus.PAID);
                payrollPeriodRepository.save(period);
            }
        } else {
            // Finance từ chối yêu cầu thanh toán
            paymentRequest.setStatus(PaymentRequestStatus.REJECTED);

            // Nếu là yêu cầu chi LƯƠNG bị từ chối thì sẽ rollback để HR kiểm tra và chỉnh sửa lại
            if (paymentRequest.getType() == PaymentRequestType.SALARY) {
                PayrollBatch batch = paymentRequest.getPayrollBatch();

                //Đưa tất cả payslip CONFIRMED về lại DRAFT để HR có thể chỉnh sửa
                List<Payslip> payslips = payslipRepository.findAllByBatch_BatchId(batch.getBatchId());
                for (Payslip p : payslips) {
                    if (p.getStatus() == PayslipStatus.CONFIRMED) {
                        p.setStatus(PayslipStatus.DRAFT);
                        p.setConfirmedAt(null);
                    }
                }
                payslipRepository.saveAll(payslips);

                //Đưa Batch về lại DRAFT (HR cần confirm lại sau khi chỉnh sửa)
                batch.setStatus(PayrollBatchStatus.DRAFT);
                payrollBatchRepository.save(batch);


                //dữ liệu bảng lương đã thay đổi, HR phải nộp lại sau khi chỉnh sửa xong
                List<PaymentRequest> pendingTaxRequests = paymentRequestRepository
                        .findAllByPayrollBatch_BatchIdAndTypeAndStatus(
                                batch.getBatchId(),
                                PaymentRequestType.TAX_INSURANCE,
                                PaymentRequestStatus.PENDING);
                for (PaymentRequest taxReq : pendingTaxRequests) {
                    taxReq.setStatus(PaymentRequestStatus.REJECTED);
                    taxReq.setFinanceNote(
                            "Auto-rejected: salary payment request was rejected by Finance. " +
                            "HR must revise the payroll and resubmit the Tax & Insurance report.");
                }
                paymentRequestRepository.saveAll(pendingTaxRequests);
            }
        }

        return toResponse(paymentRequestRepository.save(paymentRequest));
    }

    //Finance: Xem danh sách các yêu cầu PENDING
    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getPendingRequests() {
        return paymentRequestRepository.findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    //Finance: Xem toàn bộ lịch sử yêu cầu (PENDING + PAID + REJECTED)
    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getAllRequests() {
        return paymentRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    //HR: Xem lịch sử các yêu cầu đã tạo
    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getMyRequests(UUID requesterId) {
        return paymentRequestRepository.findAllByRequester_EmployeeIdOrderByCreatedAtDesc(requesterId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    //Lay thong tin chi tiet 1 PaymentRequest
    @Transactional(readOnly = true)
    public PaymentRequestResponse getRequestById(UUID requestId) {
        return toResponse(findOrThrow(requestId));
    }

    private PaymentRequest findOrThrow(UUID requestId) {
        return paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found: " + requestId));
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
