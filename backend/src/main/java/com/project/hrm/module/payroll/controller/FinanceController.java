package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.ReviewPaymentRequestRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.ApiResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentRequestResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentTransactionResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayslipResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.TaxReportResponse;
import com.project.hrm.module.payroll.entity.FinanceAccount;
import com.project.hrm.module.payroll.repository.FinanceAccountRepository;
import com.project.hrm.module.payroll.service.PaymentRequestService;
import com.project.hrm.module.payroll.service.PaymentTransactionService;
import com.project.hrm.module.payroll.service.PayslipService;
import com.project.hrm.module.payroll.service.PdfGeneratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/payroll")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FINANCE')")
public class FinanceController {

    private final PaymentRequestService paymentRequestService;
    private final PayslipService payslipService;
    private final FinanceAccountRepository financeAccountRepository;
    private final PdfGeneratorService pdfGeneratorService;
    private final PaymentTransactionService paymentTransactionService;

    /**
     * GET /api/v1/finance/payroll/payment-requests/pending
     * Finance xem danh sách yêu cầu thanh toán đang chờ duyệt.
     */
    @GetMapping("/payment-requests/pending")
    public ResponseEntity<ApiResponse<List<PaymentRequestResponse>>> getPendingRequests() {
        return ResponseEntity.ok(ApiResponse.ok(paymentRequestService.getPendingRequests()));
    }

    /**
     * GET /api/v1/finance/payroll/payment-requests
     * Finance xem toàn bộ lịch sử yêu cầu (PENDING + PAID + REJECTED).
     */
    @GetMapping("/payment-requests")
    public ResponseEntity<ApiResponse<List<PaymentRequestResponse>>> getAllRequests() {
        return ResponseEntity.ok(ApiResponse.ok(paymentRequestService.getAllRequests()));
    }

    /**
     * PUT /api/v1/finance/payroll/payment-requests/{requestId}/review
     * Finance duyệt hoặc từ chối yêu cầu thanh toán.
     */
    @PutMapping("/payment-requests/{requestId}/review")
    public ResponseEntity<ApiResponse<PaymentRequestResponse>> reviewRequest(
            @PathVariable("requestId") UUID requestId,
            @RequestAttribute("employeeId") UUID approverId,
            @Valid @RequestBody ReviewPaymentRequestRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                request.getApproved() ? "Đã duyệt yêu cầu thanh toán." : "Đã từ chối yêu cầu thanh toán.",
                paymentRequestService.reviewRequest(approverId, requestId, request)));
    }

    /**
     * GET /api/v1/finance/payroll/batches/{batchId}/tax-report
     * Finance xem báo cáo thuế & bảo hiểm trong một batch.
     */
    @GetMapping("/batches/{batchId}/tax-report")
    public ResponseEntity<ApiResponse<List<TaxReportResponse>>> getTaxReportByBatch(
            @PathVariable("batchId") UUID batchId) {
        return ResponseEntity.ok(ApiResponse.ok(payslipService.getTaxReportByBatch(batchId)));
    }

    /**
     * GET /api/v1/finance/payroll/payment-requests/{requestId}/download
     * Finance tải xuống báo cáo chi tiết đính kèm yêu cầu (PDF).
     */
    @GetMapping("/payment-requests/{requestId}/download")
    public ResponseEntity<byte[]> downloadPaymentReport(@PathVariable("requestId") UUID requestId) {
        PaymentRequestResponse request = paymentRequestService.getRequestById(requestId);
        byte[] pdfBytes;
        String filename;

        if (request.getType() == com.project.hrm.module.payroll.enums.PaymentRequestType.SALARY) {
            List<PayslipResponse> payslips = payslipService.getPayslipsByBatch(request.getPayrollBatchId());
            pdfBytes = pdfGeneratorService.generateBankTransferPdf(request, payslips);
            filename = "Salary_Payment_Report_" + request.getPayrollBatchId() + ".pdf";
        } else {
            List<TaxReportResponse> reports = payslipService.getTaxReportByBatch(request.getPayrollBatchId());
            pdfBytes = pdfGeneratorService.generateTaxInsurancePdf(request, reports);
            filename = "Tax_Insurance_Report_" + request.getPayrollBatchId() + ".pdf";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * GET /api/v1/finance/payroll/batches/{batchId}/payslips
     * Finance xem danh sách phiếu lương trong một batch để duyệt.
     */
    @GetMapping("/batches/{batchId}/payslips")
    public ResponseEntity<ApiResponse<List<PayslipResponse>>> getPayslipsByBatch(
            @PathVariable("batchId") UUID batchId) {
        return ResponseEntity.ok(ApiResponse.ok(payslipService.getPayslipsByBatch(batchId)));
    }

    /**
     * GET /api/v1/finance/payroll/accounts/active
     * Lấy danh sách tài khoản nguồn đang hoạt động.
     */
    @GetMapping("/accounts/active")
    public ResponseEntity<ApiResponse<List<FinanceAccount>>> getActiveAccounts() {
        return ResponseEntity.ok(ApiResponse.ok(financeAccountRepository.findAllByStatus("ACTIVE")));
    }

    /**
     * GET /api/v1/finance/payroll/transactions
     * UR_F004: Finance xem toàn bộ lịch sử giao dịch ngân hàng thực tế (mới nhất
     * trước).
     */
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<PaymentTransactionResponse>>> getAllTransactions() {
        return ResponseEntity.ok(ApiResponse.ok(paymentTransactionService.getAllTransactions()));
    }

    /**
     * GET /api/v1/finance/payroll/payment-batches/{paymentBatchId}/transactions
     * UR_F004: Finance xem lịch sử giao dịch theo từng payment batch.
     */
    @GetMapping("/payment-batches/{paymentBatchId}/transactions")
    public ResponseEntity<ApiResponse<List<PaymentTransactionResponse>>> getTransactionsByBatch(
            @PathVariable("paymentBatchId") UUID paymentBatchId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentTransactionService.getTransactionsByBatch(paymentBatchId)));
    }
}
