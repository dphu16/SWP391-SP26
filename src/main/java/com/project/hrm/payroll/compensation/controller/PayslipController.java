package com.project.hrm.payroll.compensation.controller;

import com.project.hrm.payroll.compensation.entity.Payslip;
import com.project.hrm.payroll.compensation.service.PayslipService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/payroll/payslips")
@RequiredArgsConstructor
public class PayslipController {

    private final PayslipService service;

    @PostMapping("/create")
    public Payslip create(
            @RequestParam UUID employeeId,
            @RequestParam UUID periodId) {

        return service.createPayslip(employeeId, periodId);
    }
}

