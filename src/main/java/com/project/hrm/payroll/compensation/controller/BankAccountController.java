package com.project.hrm.payroll.compensation.controller;

import com.project.hrm.payroll.compensation.entity.BankAccount;
import com.project.hrm.payroll.compensation.service.BankAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/payroll/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService service;

    @GetMapping("/primary/{employeeId}")
    public BankAccount getPrimary(@PathVariable UUID employeeId) {
        return service.getPrimary(employeeId);
    }
}

