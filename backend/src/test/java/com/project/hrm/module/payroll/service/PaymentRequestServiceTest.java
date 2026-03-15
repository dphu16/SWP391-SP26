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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho PaymentRequestService.
 *
 * Enum values chính xác:
 *   PayrollBatchStatus   : DRAFT, VALIDATED, PROCESSED, LOCKED
 *   PaymentRequestStatus : PENDING, APPROVED, REJECTED, PAID
 *   PaymentRequestType   : SALARY, TAX_INSURANCE
 *   PayslipStatus        : DRAFT, CONFIRMED, PAID, CANCELLED
 *   PayrollPeriodStatus  : OPEN, CLOSED, PAID
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PaymentRequestService Tests")
class PaymentRequestServiceTest {

    @Mock private PaymentRequestRepository  paymentRequestRepository;
    @Mock private PayrollBatchRepository    payrollBatchRepository;
    @Mock private FinanceAccountRepository  financeAccountRepository;
    @Mock private PayslipRepository         payslipRepository;
    @Mock private PayrollPeriodRepository   payrollPeriodRepository;

    @InjectMocks
    private PaymentRequestService paymentRequestService;

    // ─── Common fixtures ───────────────────────────────────────────────────────
    private UUID requesterId;
    private UUID batchId;
    private UUID accountId;
    private UUID requestId;

    private PayrollBatch   batch;
    private PayrollPeriod  period;
    private FinanceAccount sourceAccount;
    private PaymentRequest paymentRequest;

    private CreatePaymentRequestRequest createReq;
    private ReviewPaymentRequestRequest reviewReq;

    @BeforeEach
    void setUp() {
        requesterId = UUID.randomUUID();
        batchId     = UUID.randomUUID();
        accountId   = UUID.randomUUID();
        requestId   = UUID.randomUUID();

        // ✅ PayrollPeriodStatus.OPEN (không phải ACTIVE)
        period = new PayrollPeriod();
        period.setPeriodId(UUID.randomUUID());
        period.setStatus(PayrollPeriodStatus.OPEN);

        batch = new PayrollBatch();
        batch.setBatchId(batchId);
        batch.setStatus(PayrollBatchStatus.VALIDATED);
        batch.setPeriod(period);

        sourceAccount = new FinanceAccount();
        sourceAccount.setAccountId(accountId);
        sourceAccount.setAccountName("Main Account");
        sourceAccount.setStatus("ACTIVE");
        sourceAccount.setCurrentBalance(new BigDecimal("100000000"));

        // Default createReq: SALARY type
        createReq = new CreatePaymentRequestRequest();
        createReq.setPayrollBatchId(batchId);
        createReq.setSourceAccountId(accountId);
        createReq.setType(PaymentRequestType.SALARY);
        createReq.setHrNote("Thanh toán lương tháng 3");
        createReq.setReportUrl("http://report.url");

        // Default reviewReq: approved = true
        reviewReq = new ReviewPaymentRequestRequest();
        reviewReq.setApproved(true);
        reviewReq.setFinanceNote("Đã duyệt");

        // Default paymentRequest
        Employee requester = new Employee();
        requester.setEmployeeId(requesterId);

        paymentRequest = new PaymentRequest();
        paymentRequest.setRequestId(requestId);
        paymentRequest.setPayrollBatch(batch);
        paymentRequest.setRequester(requester);
        paymentRequest.setSourceAccount(sourceAccount);
        paymentRequest.setTotalAmountRequested(new BigDecimal("50000000"));
        paymentRequest.setStatus(PaymentRequestStatus.PENDING);
        paymentRequest.setType(PaymentRequestType.SALARY);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. createRequest – Validation
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. createRequest – Validation")
    class CreateRequestValidation {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi batch không tồn tại")
        void shouldThrow_WhenBatchNotFound() {
            when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Batch");
        }

        @Test
        @DisplayName("Throw PayrollException khi batch ở trạng thái DRAFT")
        void shouldThrow_WhenBatchIsDraft() {
            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            assertThatThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq))
                    .isInstanceOf(PayrollException.class);
        }

        @Test
        @DisplayName("Chấp nhận batch trạng thái VALIDATED")
        void shouldAccept_WhenBatchIsValidated() {
            batch.setStatus(PayrollBatchStatus.VALIDATED);
            stubCreateHappyPath(PaymentRequestType.SALARY, new BigDecimal("50000000"));

            assertThatNoException()
                    .isThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq));
        }

        @Test
        @DisplayName("Chấp nhận batch trạng thái PROCESSED")
        void shouldAccept_WhenBatchIsProcessed() {
            batch.setStatus(PayrollBatchStatus.PROCESSED);
            stubCreateHappyPath(PaymentRequestType.SALARY, new BigDecimal("50000000"));

            assertThatNoException()
                    .isThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq));
        }

        @Test
        @DisplayName("Chấp nhận batch trạng thái LOCKED")
        void shouldAccept_WhenBatchIsLocked() {
            batch.setStatus(PayrollBatchStatus.LOCKED);
            stubCreateHappyPath(PaymentRequestType.SALARY, new BigDecimal("50000000"));

            assertThatNoException()
                    .isThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq));
        }

        @Test
        @DisplayName("Throw ResourceNotFoundException khi tài khoản nguồn không tồn tại")
        void shouldThrow_WhenSourceAccountNotFound() {
            when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(financeAccountRepository.findById(accountId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Tài khoản");
        }

        @Test
        @DisplayName("Throw PayrollException khi tài khoản nguồn không ACTIVE")
        void shouldThrow_WhenSourceAccountNotActive() {
            sourceAccount.setStatus("INACTIVE");
            when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(financeAccountRepository.findById(accountId)).thenReturn(Optional.of(sourceAccount));

            assertThatThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("ACTIVE");
        }

        @Test
        @DisplayName("Throw PayrollException khi totalAmount = 0")
        void shouldThrow_WhenTotalAmountIsZero() {
            when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(financeAccountRepository.findById(accountId)).thenReturn(Optional.of(sourceAccount));
            when(payslipRepository.sumNetSalaryByBatchId(batchId)).thenReturn(BigDecimal.ZERO);

            assertThatThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("số tiền");
        }

        @Test
        @DisplayName("Throw PayrollException khi số dư tài khoản không đủ")
        void shouldThrow_WhenInsufficientBalance() {
            sourceAccount.setCurrentBalance(new BigDecimal("1000")); // nhỏ hơn 50,000,000
            when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(financeAccountRepository.findById(accountId)).thenReturn(Optional.of(sourceAccount));
            when(payslipRepository.sumNetSalaryByBatchId(batchId)).thenReturn(new BigDecimal("50000000"));

            assertThatThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("Số dư");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. createRequest – SALARY type
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. createRequest – SALARY type")
    class CreateRequestSalary {

        @Test
        @DisplayName("Tạo PaymentRequest thành công với type = SALARY")
        void shouldCreateRequest_WhenSalaryType() {
            stubCreateHappyPath(PaymentRequestType.SALARY, new BigDecimal("50000000"));

            PaymentRequestResponse response = paymentRequestService.createRequest(requesterId, createReq);

            assertThat(response).isNotNull();
            verify(paymentRequestRepository).save(any(PaymentRequest.class));
        }

        @Test
        @DisplayName("totalAmount lấy từ sumNetSalaryByBatchId khi type = SALARY")
        void shouldUseSumNetSalary_WhenSalaryType() {
            stubCreateHappyPath(PaymentRequestType.SALARY, new BigDecimal("50000000"));

            paymentRequestService.createRequest(requesterId, createReq);

            verify(payslipRepository).sumNetSalaryByBatchId(batchId);
            verify(payslipRepository, never()).sumTaxAmountByBatchId(any());
            verify(payslipRepository, never()).sumInsuranceAmountByBatchId(any());
        }

        @Test
        @DisplayName("Batch status → PROCESSED sau khi tạo SALARY request")
        void shouldUpdateBatchStatus_ToProcessed_AfterSalaryRequest() {
            stubCreateHappyPath(PaymentRequestType.SALARY, new BigDecimal("50000000"));

            paymentRequestService.createRequest(requesterId, createReq);

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.PROCESSED);
            verify(payrollBatchRepository).save(batch);
        }

        @Test
        @DisplayName("PaymentRequest được lưu với status = PENDING")
        void shouldSaveRequest_WithPendingStatus() {
            stubCreateHappyPath(PaymentRequestType.SALARY, new BigDecimal("50000000"));

            paymentRequestService.createRequest(requesterId, createReq);

            ArgumentCaptor<PaymentRequest> captor = ArgumentCaptor.forClass(PaymentRequest.class);
            verify(paymentRequestRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(PaymentRequestStatus.PENDING);
        }

        @Test
        @DisplayName("PaymentRequest chứa đúng totalAmountRequested")
        void shouldSetCorrectTotalAmount_WhenSalaryType() {
            BigDecimal netSalary = new BigDecimal("75000000");
            stubCreateHappyPath(PaymentRequestType.SALARY, netSalary);

            paymentRequestService.createRequest(requesterId, createReq);

            ArgumentCaptor<PaymentRequest> captor = ArgumentCaptor.forClass(PaymentRequest.class);
            verify(paymentRequestRepository).save(captor.capture());
            assertThat(captor.getValue().getTotalAmountRequested()).isEqualByComparingTo(netSalary);
        }

        @Test
        @DisplayName("hrNote và reportUrl được lưu vào PaymentRequest")
        void shouldSaveHrNoteAndReportUrl() {
            stubCreateHappyPath(PaymentRequestType.SALARY, new BigDecimal("50000000"));

            paymentRequestService.createRequest(requesterId, createReq);

            ArgumentCaptor<PaymentRequest> captor = ArgumentCaptor.forClass(PaymentRequest.class);
            verify(paymentRequestRepository).save(captor.capture());
            assertThat(captor.getValue().getHrNote()).isEqualTo("Thanh toán lương tháng 3");
            assertThat(captor.getValue().getReportUrl()).isEqualTo("http://report.url");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. createRequest – TAX_INSURANCE type
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. createRequest – TAX_INSURANCE type")
    class CreateRequestTaxInsurance {

        @BeforeEach
        void setTaxInsuranceType() {
            createReq.setType(PaymentRequestType.TAX_INSURANCE);
        }

        @Test
        @DisplayName("Throw PayrollException khi đã tồn tại TAX_INSURANCE request cho batch này")
        void shouldThrow_WhenTaxInsuranceAlreadyExists() {
            when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(financeAccountRepository.findById(accountId)).thenReturn(Optional.of(sourceAccount));
            when(paymentRequestRepository.existsByPayrollBatch_BatchIdAndType(
                    batchId, PaymentRequestType.TAX_INSURANCE)).thenReturn(true);

            assertThatThrownBy(() -> paymentRequestService.createRequest(requesterId, createReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã được gửi");
        }

        @Test
        @DisplayName("Tạo TAX_INSURANCE request thành công khi chưa có")
        void shouldCreateTaxInsuranceRequest_WhenNotExists() {
            stubCreateHappyPath(PaymentRequestType.TAX_INSURANCE, new BigDecimal("5000000"));

            PaymentRequestResponse response = paymentRequestService.createRequest(requesterId, createReq);

            assertThat(response).isNotNull();
            verify(paymentRequestRepository).save(any(PaymentRequest.class));
        }

        @Test
        @DisplayName("totalAmount = pit + insurance khi type = TAX_INSURANCE")
        void shouldSumPitAndInsurance_WhenTaxInsuranceType() {
            when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(financeAccountRepository.findById(accountId)).thenReturn(Optional.of(sourceAccount));
            when(paymentRequestRepository.existsByPayrollBatch_BatchIdAndType(
                    batchId, PaymentRequestType.TAX_INSURANCE)).thenReturn(false);
            when(payslipRepository.sumTaxAmountByBatchId(batchId)).thenReturn(new BigDecimal("2000000"));
            when(payslipRepository.sumInsuranceAmountByBatchId(batchId)).thenReturn(new BigDecimal("3000000"));
            when(paymentRequestRepository.save(any())).thenAnswer(inv -> {
                PaymentRequest r = inv.getArgument(0);
                r.setRequestId(requestId);
                return r;
            });

            paymentRequestService.createRequest(requesterId, createReq);

            ArgumentCaptor<PaymentRequest> captor = ArgumentCaptor.forClass(PaymentRequest.class);
            verify(paymentRequestRepository).save(captor.capture());
            assertThat(captor.getValue().getTotalAmountRequested())
                    .isEqualByComparingTo("5000000"); // 2,000,000 + 3,000,000
        }

        @Test
        @DisplayName("Batch status KHÔNG đổi sang PROCESSED khi type = TAX_INSURANCE")
        void shouldNotUpdateBatchStatus_WhenTaxInsuranceType() {
            batch.setStatus(PayrollBatchStatus.VALIDATED);
            stubCreateHappyPath(PaymentRequestType.TAX_INSURANCE, new BigDecimal("5000000"));

            paymentRequestService.createRequest(requesterId, createReq);

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.VALIDATED);
            verify(payrollBatchRepository, never()).save(batch);
        }

        @Test
        @DisplayName("Chỉ gọi sumTax và sumInsurance, không gọi sumNetSalary")
        void shouldUseSumTaxAndInsurance_NotNetSalary() {
            stubCreateHappyPath(PaymentRequestType.TAX_INSURANCE, new BigDecimal("5000000"));

            paymentRequestService.createRequest(requesterId, createReq);

            verify(payslipRepository).sumTaxAmountByBatchId(batchId);
            verify(payslipRepository).sumInsuranceAmountByBatchId(batchId);
            verify(payslipRepository, never()).sumNetSalaryByBatchId(any());
        }

        @Test
        @DisplayName("TAX_INSURANCE request được lưu với status = PENDING")
        void shouldSaveWithPendingStatus_WhenTaxInsuranceType() {
            stubCreateHappyPath(PaymentRequestType.TAX_INSURANCE, new BigDecimal("5000000"));

            paymentRequestService.createRequest(requesterId, createReq);

            ArgumentCaptor<PaymentRequest> captor = ArgumentCaptor.forClass(PaymentRequest.class);
            verify(paymentRequestRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(PaymentRequestStatus.PENDING);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. reviewRequest – Validation
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. reviewRequest – Validation")
    class ReviewRequestValidation {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi request không tồn tại")
        void shouldThrow_WhenRequestNotFound() {
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentRequestService.reviewRequest(
                    UUID.randomUUID(), requestId, reviewReq))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(requestId.toString());
        }

        @Test
        @DisplayName("Throw PayrollException khi request đã PAID")
        void shouldThrow_WhenRequestAlreadyPaid() {
            paymentRequest.setStatus(PaymentRequestStatus.PAID);
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.of(paymentRequest));

            assertThatThrownBy(() -> paymentRequestService.reviewRequest(
                    UUID.randomUUID(), requestId, reviewReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã được xử lý");
        }

        @Test
        @DisplayName("Throw PayrollException khi request đã APPROVED")
        void shouldThrow_WhenRequestAlreadyApproved() {
            paymentRequest.setStatus(PaymentRequestStatus.APPROVED);
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.of(paymentRequest));

            assertThatThrownBy(() -> paymentRequestService.reviewRequest(
                    UUID.randomUUID(), requestId, reviewReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã được xử lý");
        }

        @Test
        @DisplayName("Throw PayrollException khi request đã REJECTED")
        void shouldThrow_WhenRequestAlreadyRejected() {
            paymentRequest.setStatus(PaymentRequestStatus.REJECTED);
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.of(paymentRequest));

            assertThatThrownBy(() -> paymentRequestService.reviewRequest(
                    UUID.randomUUID(), requestId, reviewReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã được xử lý");
        }

        @Test
        @DisplayName("Throw PayrollException khi số dư không đủ lúc approve")
        void shouldThrow_WhenInsufficientBalance_OnApprove() {
            sourceAccount.setCurrentBalance(new BigDecimal("1000")); // nhỏ hơn 50,000,000
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.of(paymentRequest));

            assertThatThrownBy(() -> paymentRequestService.reviewRequest(
                    UUID.randomUUID(), requestId, reviewReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("Số dư");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. reviewRequest – Approve SALARY
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("5. reviewRequest – Approve SALARY")
    class ReviewRequestApproveSalary {

        @BeforeEach
        void stubBase() {
            paymentRequest.setType(PaymentRequestType.SALARY);
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.of(paymentRequest));
            when(paymentRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of());
        }

        @Test
        @DisplayName("Khấu trừ đúng số tiền từ tài khoản nguồn")
        void shouldDeductAmount_FromSourceAccount() {
            BigDecimal before = sourceAccount.getCurrentBalance();
            BigDecimal amount = paymentRequest.getTotalAmountRequested();

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(sourceAccount.getCurrentBalance())
                    .isEqualByComparingTo(before.subtract(amount));
            verify(financeAccountRepository).save(sourceAccount);
        }

        @Test
        @DisplayName("PaymentRequest status → PAID sau khi approve")
        void shouldUpdateRequestStatus_ToPaid() {
            PaymentRequestResponse response = paymentRequestService
                    .reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(response.getStatus()).isEqualTo(PaymentRequestStatus.PAID);
        }

        @Test
        @DisplayName("approvedAt được set sau khi approve")
        void shouldSetApprovedAt_AfterApprove() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(paymentRequest.getApprovedAt()).isNotNull();
        }

        @Test
        @DisplayName("Payslip CONFIRMED → PAID và paidAt được set")
        void shouldUpdateConfirmedPayslips_ToPaid() {
            Payslip confirmed = buildPayslip(PayslipStatus.CONFIRMED);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(confirmed));

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(confirmed.getStatus()).isEqualTo(PayslipStatus.PAID);
            assertThat(confirmed.getPaidAt()).isNotNull();
        }

        @Test
        @DisplayName("Payslip DRAFT không bị đổi sang PAID")
        void shouldNotUpdateDraftPayslips_ToPaid() {
            Payslip draft = buildPayslip(PayslipStatus.DRAFT);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(draft));

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(draft.getStatus()).isEqualTo(PayslipStatus.DRAFT);
            assertThat(draft.getPaidAt()).isNull();
        }

        @Test
        @DisplayName("Payslip CANCELLED không bị đổi sang PAID")
        void shouldNotUpdateCancelledPayslips_ToPaid() {
            Payslip cancelled = buildPayslip(PayslipStatus.CANCELLED);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(cancelled));

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(cancelled.getStatus()).isEqualTo(PayslipStatus.CANCELLED);
        }

        @Test
        @DisplayName("Batch status → LOCKED sau khi approve SALARY")
        void shouldUpdateBatchStatus_ToLocked() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.LOCKED);
            verify(payrollBatchRepository).save(batch);
        }

        @Test
        @DisplayName("Period status → PAID sau khi approve SALARY")
        void shouldUpdatePeriodStatus_ToPaid() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            // ✅ PayrollPeriodStatus.PAID (không phải CLOSED)
            assertThat(period.getStatus()).isEqualTo(PayrollPeriodStatus.PAID);
            verify(payrollPeriodRepository).save(period);
        }

        @Test
        @DisplayName("saveAll payslips được gọi sau khi approve SALARY")
        void shouldSaveAllPayslips_AfterApprove() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            verify(payslipRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("financeNote và approverId được ghi nhận")
        void shouldSetFinanceNoteAndApprover() {
            UUID approverId = UUID.randomUUID();

            paymentRequestService.reviewRequest(approverId, requestId, reviewReq);

            assertThat(paymentRequest.getFinanceNote()).isEqualTo("Đã duyệt");
            assertThat(paymentRequest.getApprover().getEmployeeId()).isEqualTo(approverId);
        }

        @Test
        @DisplayName("Nhiều payslip: chỉ CONFIRMED → PAID, các status khác giữ nguyên")
        void shouldOnlyUpdateConfirmedPayslips_WhenMixed() {
            Payslip confirmed  = buildPayslip(PayslipStatus.CONFIRMED);
            Payslip draft      = buildPayslip(PayslipStatus.DRAFT);
            Payslip cancelled  = buildPayslip(PayslipStatus.CANCELLED);
            when(payslipRepository.findAllByBatch_BatchId(batchId))
                    .thenReturn(List.of(confirmed, draft, cancelled));

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(confirmed.getStatus()).isEqualTo(PayslipStatus.PAID);
            assertThat(draft.getStatus()).isEqualTo(PayslipStatus.DRAFT);
            assertThat(cancelled.getStatus()).isEqualTo(PayslipStatus.CANCELLED);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. reviewRequest – Approve TAX_INSURANCE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("6. reviewRequest – Approve TAX_INSURANCE")
    class ReviewRequestApproveTaxInsurance {

        @BeforeEach
        void stubBase() {
            paymentRequest.setType(PaymentRequestType.TAX_INSURANCE);
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.of(paymentRequest));
            when(paymentRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }

        @Test
        @DisplayName("Khấu trừ tiền từ tài khoản khi approve TAX_INSURANCE")
        void shouldDeductAmount_WhenTaxInsuranceApproved() {
            BigDecimal before = sourceAccount.getCurrentBalance();
            BigDecimal amount = paymentRequest.getTotalAmountRequested();

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(sourceAccount.getCurrentBalance())
                    .isEqualByComparingTo(before.subtract(amount));
            verify(financeAccountRepository).save(sourceAccount);
        }

        @Test
        @DisplayName("Status → PAID khi approve TAX_INSURANCE")
        void shouldSetStatusPaid_WhenTaxInsuranceApproved() {
            PaymentRequestResponse response = paymentRequestService
                    .reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(response.getStatus()).isEqualTo(PaymentRequestStatus.PAID);
        }

        @Test
        @DisplayName("Batch KHÔNG bị LOCKED khi approve TAX_INSURANCE")
        void shouldNotLockBatch_WhenTaxInsuranceApproved() {
            PayrollBatchStatus statusBefore = batch.getStatus();

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(batch.getStatus()).isEqualTo(statusBefore);
            verify(payrollBatchRepository, never()).save(any());
        }

        @Test
        @DisplayName("Payslips KHÔNG bị cập nhật khi approve TAX_INSURANCE")
        void shouldNotUpdatePayslips_WhenTaxInsuranceApproved() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            verify(payslipRepository, never()).findAllByBatch_BatchId(any());
            verify(payslipRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("Period KHÔNG bị cập nhật khi approve TAX_INSURANCE")
        void shouldNotUpdatePeriod_WhenTaxInsuranceApproved() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            verify(payrollPeriodRepository, never()).save(any());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. reviewRequest – Reject
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("7. reviewRequest – Reject")
    class ReviewRequestReject {

        @BeforeEach
        void stubReject() {
            reviewReq.setApproved(false);
            reviewReq.setFinanceNote("Thiếu chứng từ");
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.of(paymentRequest));
            when(paymentRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }

        @Test
        @DisplayName("Status → REJECTED khi từ chối")
        void shouldSetStatusRejected_WhenRejected() {
            PaymentRequestResponse response = paymentRequestService
                    .reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(response.getStatus()).isEqualTo(PaymentRequestStatus.REJECTED);
        }

        @Test
        @DisplayName("Số dư tài khoản KHÔNG thay đổi khi từ chối")
        void shouldNotDeductBalance_WhenRejected() {
            BigDecimal before = sourceAccount.getCurrentBalance();

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(sourceAccount.getCurrentBalance()).isEqualByComparingTo(before);
            verify(financeAccountRepository, never()).save(any());
        }

        @Test
        @DisplayName("Batch status KHÔNG thay đổi khi từ chối")
        void shouldNotUpdateBatch_WhenRejected() {
            PayrollBatchStatus before = batch.getStatus();

            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(batch.getStatus()).isEqualTo(before);
            verify(payrollBatchRepository, never()).save(any());
        }

        @Test
        @DisplayName("Payslips KHÔNG bị cập nhật khi từ chối")
        void shouldNotUpdatePayslips_WhenRejected() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            verify(payslipRepository, never()).findAllByBatch_BatchId(any());
            verify(payslipRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("Period KHÔNG bị cập nhật khi từ chối")
        void shouldNotUpdatePeriod_WhenRejected() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            verify(payrollPeriodRepository, never()).save(any());
        }

        @Test
        @DisplayName("financeNote được ghi nhận khi từ chối")
        void shouldSetFinanceNote_WhenRejected() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(paymentRequest.getFinanceNote()).isEqualTo("Thiếu chứng từ");
        }

        @Test
        @DisplayName("approvedAt KHÔNG được set khi từ chối")
        void shouldNotSetApprovedAt_WhenRejected() {
            paymentRequestService.reviewRequest(UUID.randomUUID(), requestId, reviewReq);

            assertThat(paymentRequest.getApprovedAt()).isNull();
        }

        @Test
        @DisplayName("approverId được ghi nhận khi từ chối")
        void shouldSetApprover_WhenRejected() {
            UUID approverId = UUID.randomUUID();

            paymentRequestService.reviewRequest(approverId, requestId, reviewReq);

            assertThat(paymentRequest.getApprover().getEmployeeId()).isEqualTo(approverId);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. getPendingRequests
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("8. getPendingRequests")
    class GetPendingRequests {

        @Test
        @DisplayName("Trả về list PENDING requests")
        void shouldReturnPendingRequests() {
            when(paymentRequestRepository.findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus.PENDING))
                    .thenReturn(List.of(paymentRequest));

            List<PaymentRequestResponse> result = paymentRequestService.getPendingRequests();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Trả về list rỗng khi không có PENDING request")
        void shouldReturnEmptyList_WhenNoPendingRequests() {
            when(paymentRequestRepository.findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus.PENDING))
                    .thenReturn(List.of());

            assertThat(paymentRequestService.getPendingRequests()).isEmpty();
        }

        @Test
        @DisplayName("Gọi đúng repository method với status PENDING")
        void shouldCallRepository_WithPendingStatus() {
            when(paymentRequestRepository.findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus.PENDING))
                    .thenReturn(List.of());

            paymentRequestService.getPendingRequests();

            verify(paymentRequestRepository)
                    .findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus.PENDING);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. getMyRequests
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("9. getMyRequests")
    class GetMyRequests {

        @Test
        @DisplayName("Trả về list requests của requester")
        void shouldReturnRequesterRequests() {
            when(paymentRequestRepository
                    .findAllByRequester_EmployeeIdOrderByCreatedAtDesc(requesterId))
                    .thenReturn(List.of(paymentRequest));

            List<PaymentRequestResponse> result = paymentRequestService.getMyRequests(requesterId);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Trả về list rỗng khi requester chưa có request nào")
        void shouldReturnEmptyList_WhenNoRequests() {
            when(paymentRequestRepository
                    .findAllByRequester_EmployeeIdOrderByCreatedAtDesc(requesterId))
                    .thenReturn(List.of());

            assertThat(paymentRequestService.getMyRequests(requesterId)).isEmpty();
        }

        @Test
        @DisplayName("Gọi đúng repository method với requesterId")
        void shouldCallRepository_WithRequesterId() {
            when(paymentRequestRepository
                    .findAllByRequester_EmployeeIdOrderByCreatedAtDesc(requesterId))
                    .thenReturn(List.of());

            paymentRequestService.getMyRequests(requesterId);

            verify(paymentRequestRepository)
                    .findAllByRequester_EmployeeIdOrderByCreatedAtDesc(requesterId);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. getRequestById
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("10. getRequestById")
    class GetRequestById {

        @Test
        @DisplayName("Trả về đúng request khi tìm thấy")
        void shouldReturnRequest_WhenFound() {
            when(paymentRequestRepository.findById(requestId))
                    .thenReturn(Optional.of(paymentRequest));

            PaymentRequestResponse response = paymentRequestService.getRequestById(requestId);

            assertThat(response).isNotNull();
            assertThat(response.getRequestId()).isEqualTo(requestId);
        }

        @Test
        @DisplayName("Throw ResourceNotFoundException khi request không tồn tại")
        void shouldThrow_WhenRequestNotFound() {
            when(paymentRequestRepository.findById(requestId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentRequestService.getRequestById(requestId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(requestId.toString());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Stub happy-path cho createRequest.
     * Constructor AttendanceAggregationDTO: (employeeId, workHours, otHours, absentDays)
     */
    private void stubCreateHappyPath(PaymentRequestType type, BigDecimal totalAmount) {
        createReq.setType(type);
        when(payrollBatchRepository.findById(batchId)).thenReturn(Optional.of(batch));
        when(financeAccountRepository.findById(accountId)).thenReturn(Optional.of(sourceAccount));

        if (type == PaymentRequestType.TAX_INSURANCE) {
            when(paymentRequestRepository.existsByPayrollBatch_BatchIdAndType(
                    batchId, PaymentRequestType.TAX_INSURANCE)).thenReturn(false);
            BigDecimal half = totalAmount.divide(BigDecimal.valueOf(2));
            when(payslipRepository.sumTaxAmountByBatchId(batchId)).thenReturn(half);
            when(payslipRepository.sumInsuranceAmountByBatchId(batchId)).thenReturn(half);
        } else {
            when(payslipRepository.sumNetSalaryByBatchId(batchId)).thenReturn(totalAmount);
        }

        when(paymentRequestRepository.save(any())).thenAnswer(inv -> {
            PaymentRequest r = inv.getArgument(0);
            r.setRequestId(requestId);
            return r;
        });
    }

    /** Tạo Payslip với PayslipStatus cho trước. */
    private Payslip buildPayslip(PayslipStatus status) {
        Employee emp = new Employee();
        emp.setEmployeeId(UUID.randomUUID());

        Payslip p = new Payslip();
        p.setPayslipId(UUID.randomUUID());
        p.setBatch(batch);
        p.setEmployee(emp);
        p.setStatus(status);
        p.setNetSalary(new BigDecimal("10000000"));
        return p;
    }
}