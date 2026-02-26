package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.service.PayrollService;
<<<<<<< HEAD:backend/src/main/java/com/project/hrm/module/payroll/compensation/controller/PayrollController.java
import com.project.hrm.module.payroll.compensation.service.PayrollService;
import com.project.hrm.payroll.compensation.dto.PayrollAggregateDTO;
import com.project.hrm.payroll.compensation.dto.PayrollSummaryDTO;
import com.project.hrm.payroll.compensation.service.PayrollService;
=======
import com.project.hrm.module.payroll.service.PayrollService;
>>>>>>> df05727451ef27a28699bbdee957247d77b96b1d:backend/src/main/java/com/project/hrm/module/payroll/controller/PayrollController.java
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {
    private final PayrollService payrollService;

    @PostMapping("/run/{periodId}")
    public ResponseEntity<String> runPayroll(@PathVariable UUID periodId) {
        payrollService.runPayroll(periodId);
        return ResponseEntity.ok("Payroll processed successfully");
    }

    @PostMapping("/generate/{periodId}")
    public ResponseEntity<String> generate(@PathVariable UUID periodId) {
        payrollService.generatePayslips(periodId);
        return ResponseEntity.ok("Generated successfully");
    }

    @PutMapping("/periods/{periodId}/confirm")
    public ResponseEntity<String> confirmAll(@PathVariable UUID periodId) {
        payrollService.confirmAllPayslips(periodId);
        return ResponseEntity.ok("All payslips confirmed");
    }

    @PutMapping("/periods/{periodId}/pay")
    public ResponseEntity<String> payAll(@PathVariable UUID periodId) {
        payrollService.payAllPayslips(periodId);
        return ResponseEntity.ok("All payslips paid and period locked");
    }

    @GetMapping("/periods/{periodId}/summary")
    public ResponseEntity<PayrollSummaryDTO> summary(@PathVariable UUID periodId) {
        return ResponseEntity.ok(payrollService.getSummary(periodId));
    }

    @GetMapping("/reports/yearly")
    public ResponseEntity<PayrollAggregateDTO> yearly(@RequestParam int year) {
        return ResponseEntity.ok(payrollService.getYearlyReport(year));
    }

    @GetMapping("/reports/monthly")
    public ResponseEntity<PayrollAggregateDTO> monthly(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(payrollService.getMonthlyReport(year, month));
    }

    // export excel file
    @GetMapping("/periods/{periodId}/export")
    public ResponseEntity<InputStreamResource> export(@PathVariable UUID periodId) throws IOException {

        ByteArrayInputStream in = payrollService.exportPayslips(periodId);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=payslips.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new InputStreamResource(in));
    }

    @PutMapping("/periods/{periodId}/rollback-confirm")
    public ResponseEntity<String> rollbackConfirm(@PathVariable UUID periodId) {
        payrollService.rollbackConfirmAll(periodId);
        return ResponseEntity.ok("Rollback confirm successful");
    }

    @PutMapping("/periods/{periodId}/rollback-pay")
    public ResponseEntity<String> rollbackPay(@PathVariable UUID periodId) {
        payrollService.rollbackPayAll(periodId);
        return ResponseEntity.ok("Rollback pay successful");
    }
}
