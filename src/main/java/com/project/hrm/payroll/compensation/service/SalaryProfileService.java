package com.project.hrm.payroll.compensation.service;

import com.project.hrm.payroll.compensation.entity.SalaryProfile;
import com.project.hrm.payroll.compensation.repository.SalaryProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalaryProfileService {

    private final SalaryProfileRepository repository;

    public SalaryProfile create(SalaryProfile profile) {
        return repository.save(profile);
    }

    public SalaryProfile getActiveByEmployee(UUID employeeId) {
        return repository.findByEmployeeIdAndIsActiveTrue(employeeId)
                .orElseThrow();
    }
}

