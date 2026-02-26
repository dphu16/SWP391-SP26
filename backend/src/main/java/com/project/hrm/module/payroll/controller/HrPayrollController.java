package com.project.hrm.module.payroll.controller;


import com.project.hrm.module.payroll.service.PayrollCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Giả sử dùng Spring Security
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hr/payroll")
@RequiredArgsConstructor
public class HrPayrollController {

    private final PayrollCalculationService payrollService;

    // API kích hoạt tính lương cho một đợt (Batch)
    // POST /api/v1/hr/payroll/calculate/{batchId}
    @PostMapping("/calculate/{batchId}")
    @PreAuthorize("hasRole('HR_MANAGER')") // Chỉ HR được phép
    public ResponseEntity<String> calculatePayroll(@PathVariable UUID batchId) {

        payrollService.calculatePayrollForBatch(batchId);

        return ResponseEntity.ok("Payroll calculation completed successfully.");
    }
}
