package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.*;
import com.project.hrm.module.payroll.dto.ResponseDTO.*;
import com.project.hrm.module.payroll.entity.FinanceAccount;
import com.project.hrm.module.payroll.repository.FinanceAccountRepository;
import com.project.hrm.module.payroll.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * API dành cho HR.
 * Quyền: ROLE_HR
 * Base path: /api/v1/hr/payroll
 *
 * Luồng chính:
 *   1. Tạo kỳ lương (period)
 *   2. Tạo batch trong kỳ
 *   3. Kích hoạt chạy lương (calculate)
 *   4. Validate & confirm từng payslip
 *   5. Gửi yêu cầu thanh toán sang Finance
 *   6. Xử lý thắc mắc nhân viên
 */
@RestController
@RequestMapping("/api/v1/hr/payroll")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROLE_HR')")
public class HRPayrollController {

    private final PayrollPeriodService periodService;
    private final PayslipService payslipService;
    private final SalaryInquiryService inquiryService;
    private final PaymentRequestService paymentRequestService;
    private final PayrollCalculationService calculationService;
    private final FinanceAccountRepository financeAccountRepository;

    // ===================== PERIOD =====================

    /** POST /api/v1/hr/payroll/periods — Tạo kỳ lương mới */
    @PostMapping("/periods")
    public ResponseEntity<ApiResponse<PayrollPeriodResponse>> createPeriod(
            @Valid @RequestBody CreatePayrollPeriodRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tạo kỳ lương thành công.", periodService.createPeriod(request)));
    }

    /** GET /api/v1/hr/payroll/periods — Danh sách tất cả kỳ lương */
    @GetMapping("/periods")
    public ResponseEntity<ApiResponse<List<PayrollPeriodResponse>>> getAllPeriods() {
        return ResponseEntity.ok(ApiResponse.ok(periodService.getAllPeriods()));
    }

    /** GET /api/v1/hr/payroll/periods/{periodId} */
    @GetMapping("/periods/{periodId}")
    public ResponseEntity<ApiResponse<PayrollPeriodResponse>> getPeriod(@PathVariable("periodId") UUID periodId) {
        return ResponseEntity.ok(ApiResponse.ok(periodService.getPeriod(periodId)));
    }

    /** PUT /api/v1/hr/payroll/periods/{periodId}/close — Đóng kỳ lương */
    @PutMapping("/periods/{periodId}/close")
    public ResponseEntity<ApiResponse<PayrollPeriodResponse>> closePeriod(@PathVariable("periodId") UUID periodId) {
        return ResponseEntity.ok(ApiResponse.ok("Đóng kỳ lương thành công.", periodService.closePeriod(periodId)));
    }

    // ===================== BATCH & PAYSLIPS =====================

    /** POST /api/v1/hr/payroll/batches/{batchId}/calculate — Yêu cầu chạy toán lương */
    @PostMapping("/batches/{batchId}/calculate")
    public ResponseEntity<ApiResponse<List<PayslipResponse>>> calculatePayslips(@PathVariable("batchId") UUID batchId) {
        // Trong hệ thống thật, employeeIds nên truyền vào hoặc lấy toàn bộ NV Active
        // Tạm thời demo: findAll employees -> tính lương.
        // Cần inject EmployeeRepository nếu làm thật, hoặc lấy từ payslipService.
        // Ở đây để đơn giản ta gọi một hàm từ payslipService bọc tính năng trên.
        return ResponseEntity.ok(ApiResponse.ok("Đã chạy lương cho Batch.", payslipService.calculateForBatch(batchId)));
    }

    /** GET /api/v1/hr/payroll/batches/{batchId}/payslips — Danh sách payslip trong batch */
    @GetMapping("/batches/{batchId}/payslips")
    public ResponseEntity<ApiResponse<List<PayslipResponse>>> getPayslipsByBatch(@PathVariable("batchId") UUID batchId) {
        return ResponseEntity.ok(ApiResponse.ok(payslipService.getPayslipsByBatch(batchId)));
    }

    /** PUT /api/v1/hr/payroll/batches/{batchId}/validate-all — Xác nhận tất cả payslip trong batch */
    @PutMapping("/batches/{batchId}/validate-all")
    public ResponseEntity<ApiResponse<List<PayslipResponse>>> validateAll(@PathVariable("batchId") UUID batchId) {
        return ResponseEntity.ok(ApiResponse.ok("Đã xác nhận tất cả phiếu lương.", payslipService.validateAllInBatch(batchId)));
    }

    /** GET /api/v1/hr/payroll/batches/{batchId}/tax-report — Danh sách Tax Report trong batch */
    @GetMapping("/batches/{batchId}/tax-report")
    public ResponseEntity<ApiResponse<List<TaxReportResponse>>> getTaxReportByBatch(@PathVariable("batchId") UUID batchId) {
        return ResponseEntity.ok(ApiResponse.ok(payslipService.getTaxReportByBatch(batchId)));
    }

    /** PUT /api/v1/hr/payroll/payslips/{payslipId}/confirm — Xác nhận phiếu lương */
    @PutMapping("/payslips/{payslipId}/confirm")
    public ResponseEntity<ApiResponse<PayslipResponse>> confirmPayslip(@PathVariable("payslipId") UUID payslipId) {
        return ResponseEntity.ok(ApiResponse.ok("Xác nhận phiếu lương thành công.", payslipService.confirmPayslip(payslipId)));
    }

    /** PUT /api/v1/hr/payroll/payslips/{payslipId}/cancel — Huỷ phiếu lương */
    @PutMapping("/payslips/{payslipId}/cancel")
    public ResponseEntity<ApiResponse<PayslipResponse>> cancelPayslip(@PathVariable("payslipId") UUID payslipId) {
        return ResponseEntity.ok(ApiResponse.ok("Huỷ phiếu lương thành công.", payslipService.cancelPayslip(payslipId)));
    }

    // ===================== FINANCE ACCOUNTS =====================

    /**
     * GET /api/v1/hr/payroll/finance-accounts/active
     * HR lấy danh sách tài khoản nguồn đang hoạt động để chọn khi gửi yêu cầu thanh toán.
     */
    @GetMapping("/finance-accounts/active")
    public ResponseEntity<ApiResponse<List<FinanceAccount>>> getActiveFinanceAccounts() {
        return ResponseEntity.ok(ApiResponse.ok(financeAccountRepository.findAllByStatus("ACTIVE")));
    }

    // ===================== PAYMENT REQUEST =====================

    /**
     * POST /api/v1/hr/payroll/payment-requests
     * HR gửi yêu cầu cấp ngân sách thanh toán lương sang Finance.
     */
    @PostMapping("/payment-requests")
    public ResponseEntity<ApiResponse<PaymentRequestResponse>> createPaymentRequest(
            @RequestAttribute("employeeId") UUID requesterId,
            @Valid @RequestBody CreatePaymentRequestRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Yêu cầu thanh toán đã được gửi sang Finance.",
                paymentRequestService.createRequest(requesterId, request)
        ));
    }

    /** GET /api/v1/hr/payroll/payment-requests/my — Lịch sử yêu cầu HR đã gửi */
    @GetMapping("/payment-requests/my")
    public ResponseEntity<ApiResponse<List<PaymentRequestResponse>>> getMyPaymentRequests(
            @RequestAttribute("employeeId") UUID requesterId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentRequestService.getMyRequests(requesterId)));
    }

    // ===================== INQUIRIES =====================

    /** GET /api/v1/hr/payroll/inquiries — Tất cả ticket */
    @GetMapping("/inquiries")
    public ResponseEntity<ApiResponse<List<SalaryInquiryDto>>> getAllInquiries() {
        return ResponseEntity.ok(ApiResponse.ok(inquiryService.getAllInquiries()));
    }

    /** PUT /api/v1/hr/payroll/inquiries/{inquiryId}/in-progress */
    @PutMapping("/inquiries/{inquiryId}/in-progress")
    public ResponseEntity<ApiResponse<SalaryInquiryDto>> markInProgress(@PathVariable("inquiryId") UUID inquiryId) {
        return ResponseEntity.ok(ApiResponse.ok(inquiryService.markInProgress(inquiryId)));
    }

    /** POST /api/v1/hr/payroll/inquiries/respond — HR phản hồi thắc mắc */
    @PostMapping("/inquiries/respond")
    public ResponseEntity<ApiResponse<SalaryInquiryDto>> respondToInquiry(
            @RequestAttribute("employeeId") UUID responderId,
            @Valid @RequestBody RespondToInquiryRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Phản hồi đã được gửi thành công.",
                inquiryService.respondToInquiry(responderId, request)
        ));
    }

    /** PUT /api/v1/hr/payroll/inquiries/{inquiryId}/reject — Từ chối thắc mắc */
    @PutMapping("/inquiries/{inquiryId}/reject")
    public ResponseEntity<ApiResponse<SalaryInquiryDto>> rejectInquiry(
            @PathVariable("inquiryId") UUID inquiryId,
            @RequestParam("reason") String reason,
            @RequestAttribute("employeeId") UUID responderId) {
        return ResponseEntity.ok(ApiResponse.ok(inquiryService.rejectInquiry(responderId, inquiryId, reason)));
    }
}