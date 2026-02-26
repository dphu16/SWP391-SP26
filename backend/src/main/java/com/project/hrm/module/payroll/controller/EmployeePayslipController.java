package com.project.hrm.module.payroll.controller;


import com.project.hrm.module.payroll.dto.PayslipDetailDTO;
import com.project.hrm.module.payroll.dto.PayslipSummaryDTO;
import com.project.hrm.module.payroll.service.EmployeePayslipService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employee/payslips")
@RequiredArgsConstructor
public class EmployeePayslipController {

    private final EmployeePayslipService payslipService;

    // Giả lập lấy ID của user đang đăng nhập
    // Trong thực tế bạn sẽ lấy từ SecurityContextHolder hoặc @AuthenticationPrincipal
    private UUID getCurrentEmployeeId() {
        // TODO: Thay thế bằng logic lấy ID thật từ Token/Session
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    /**
     * API 1: Xem danh sách lịch sử lương
     * GET /api/v1/employee/payslips?page=0&size=10&sort=createdAt,desc
     */
    @GetMapping
    public ResponseEntity<Page<PayslipSummaryDTO>> getMyPayslips(
            @PageableDefault(sort = "payrollPeriod.year", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID employeeId = getCurrentEmployeeId();
        return ResponseEntity.ok(payslipService.getMyPayslips(employeeId, pageable));
    }

    /**
     * API 2: Xem chi tiết 1 phiếu lương
     * GET /api/v1/employee/payslips/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PayslipDetailDTO> getPayslipDetail(@PathVariable UUID id) {
        UUID employeeId = getCurrentEmployeeId();
        return ResponseEntity.ok(payslipService.getPayslipDetail(employeeId, id));
    }
}
