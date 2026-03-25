package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.CreateSalaryInquiryRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.ApiResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayslipResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.SalaryInquiryDto;
import com.project.hrm.module.payroll.service.PayslipService;
import com.project.hrm.module.payroll.service.PdfGeneratorService;
import com.project.hrm.module.payroll.service.SalaryInquiryService;
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

/**
 * API dành cho Employee.
 * Quyền: ROLE_EMPLOYEE
 * Base path: /api/v1/my
 *
 * Lấy employeeId từ Security Context (JWT token) — không cho phép truyền qua param
 * để tránh employee xem lương của người khác.
 */
@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HR', 'EMPLOYEE', 'FINANCE')")
public class EmployeePayrollController {

    private final PayslipService payslipService;
    private final SalaryInquiryService salaryInquiryService;
    private final PdfGeneratorService pdfGeneratorService;

    // ===================== PAYSLIP =====================

    /**
     * GET /api/v1/my/payslips
     * Employee xem danh sách phiếu lương của mình.
     */
    @GetMapping("/payslips")
    public ResponseEntity<ApiResponse<List<PayslipResponse>>> getMyPayslips(
            @RequestAttribute("employeeId") UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(payslipService.getMyPayslips(employeeId)));
    }

    /**
     * GET /api/v1/my/payslips/{payslipId}
     * Employee xem chi tiết 1 phiếu lương — chỉ được xem của chính mình.
     */
    @GetMapping("/payslips/{payslipId}")
    public ResponseEntity<ApiResponse<PayslipResponse>> getMyPayslip(
            @PathVariable("payslipId") UUID payslipId,
            @RequestAttribute("employeeId") UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(payslipService.getMyPayslip(payslipId, employeeId)));
    }

    /**
     * GET /api/v1/my/payslips/{payslipId}/pdf
     * Employee tải PDF phiếu lương.
     */
    @GetMapping("/payslips/{payslipId}/pdf")
    public ResponseEntity<byte[]> downloadMyPayslipPdf(
            @PathVariable("payslipId") UUID payslipId,
            @RequestAttribute("employeeId") UUID employeeId) {
        PayslipResponse payslip = payslipService.getMyPayslip(payslipId, employeeId);
        byte[] pdfBytes = pdfGeneratorService.generatePayslipPdf(payslip);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Payslip_" + payslip.getMonth() + "_" + payslip.getYear() + ".pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    // ===================== INQUIRY =====================

    /**
     * GET /api/v1/my/inquiries
     * Employee xem danh sách thắc mắc đã gửi.
     */
    @GetMapping("/inquiries")
    public ResponseEntity<ApiResponse<List<SalaryInquiryDto>>> getMyInquiries(
            @RequestAttribute("employeeId") UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(salaryInquiryService.getMyInquiries(employeeId)));
    }

    /**
     * POST /api/v1/my/inquiries
     * Employee tạo thắc mắc về phiếu lương.
     */
    @PostMapping("/inquiries")
    public ResponseEntity<ApiResponse<SalaryInquiryDto>> createInquiry(
            @RequestAttribute("employeeId") UUID employeeId,
            @Valid @RequestBody CreateSalaryInquiryRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Thắc mắc đã được gửi thành công.",
                salaryInquiryService.createInquiry(employeeId, request)
        ));
    }
}

