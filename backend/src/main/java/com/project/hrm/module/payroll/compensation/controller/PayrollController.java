package com.project.hrm.module.payroll.compensation.controller;

import com.project.hrm.module.payroll.compensation.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
