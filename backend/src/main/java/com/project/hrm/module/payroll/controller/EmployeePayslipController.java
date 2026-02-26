package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.dto.PayslipDetailDTO;
import com.project.hrm.module.payroll.dto.PayslipSummaryDTO;
import com.project.hrm.module.payroll.service.EmployeePayslipService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.project.hrm.module.payroll.service.EmployeePayslipPdfService;

@RestController
@RequestMapping("/api/v1/employee/payslips")
@RequiredArgsConstructor
public class EmployeePayslipController {

    private final EmployeePayslipService payslipService;
    private final EmployeePayslipPdfService payslipPdfService;
    private final EmployeeRepository employeeRepository;

    /**
     * Lấy employeeId từ SecurityContext thay vì hardcode.
     * JwtAuthFilter đã set principal = username.
     */
    private UUID getCurrentEmployeeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Employee employee = employeeRepository.findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

        return employee.getEmployeeId();
    }

    // Helper lấy cả thông tin name
    private Employee getCurrentEmployee() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return employeeRepository.findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));
    }

    /**
     * API 1: Xem danh sách lịch sử lương
     * GET /api/v1/employee/payslips?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<Page<PayslipSummaryDTO>> getMyPayslips(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID employeeId = getCurrentEmployeeId();
        return ResponseEntity.ok(payslipService.getMyPayslips(employeeId, pageable));
    }

    /**
     * API 2: Xem chi tiết 1 phiếu lương
     * GET /api/v1/employee/payslips/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PayslipDetailDTO> getPayslipDetail(@PathVariable("id") UUID id) {
        UUID employeeId = getCurrentEmployeeId();
        return ResponseEntity.ok(payslipService.getPayslipDetail(employeeId, id));
    }

    /**
     * API 3: Tải phiếu lương PDF
     * GET /api/v1/employee/payslips/{id}/pdf
     */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPayslipPdf(@PathVariable("id") UUID id) {
        Employee employee = getCurrentEmployee();
        PayslipDetailDTO payslipDTO = payslipService.getPayslipDetail(employee.getEmployeeId(), id);

        String employeeName = employee.getFullName();
        byte[] pdfBytes = payslipPdfService.generatePayslipPdf(payslipDTO, employeeName);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                "Payslip_" + payslipDTO.getMonth() + "_" + payslipDTO.getYear() + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
