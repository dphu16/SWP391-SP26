package com.project.hrm.payroll.compensation.service;

import com.project.hrm.payroll.compensation.entity.BankAccount;
import com.project.hrm.payroll.compensation.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private final BankAccountRepository repository;

    public BankAccount getPrimary(UUID employeeId) {
        return repository.findByEmployeeIdAndIsPrimaryTrue(employeeId)
                .orElseThrow();
    }
}

