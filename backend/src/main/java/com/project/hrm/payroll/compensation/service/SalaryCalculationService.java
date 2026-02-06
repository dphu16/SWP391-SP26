package com.project.hrm.payroll.compensation.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

import com.project.hrm.payroll.compensation.entity.PayslipDetail;
import com.project.hrm.payroll.compensation.entity.SalaryProfile;
import com.project.hrm.payroll.compensation.repository.PayslipDetailRepository;
import com.project.hrm.payroll.compensation.repository.SalaryProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalaryCalculationService {

    private final SalaryProfileRepository salaryProfileRepository;
    private final PayslipDetailRepository payslipDetailRepository;

    public BigDecimal calculateGrossSalary(UUID employeeId) {
        SalaryProfile profile = salaryProfileRepository
                .findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Salary profile not found"));

        BigDecimal baseSalary = profile.getBaseSalary();

        Map<String, Object> allowancesMap = profile.getAllowances();
        BigDecimal allowanceTotal = BigDecimal.ZERO;

        if (allowancesMap != null) {
            allowanceTotal = allowancesMap.values().stream()
                    .map(value -> (BigDecimal) value)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        return baseSalary.add(allowanceTotal);
    }

    public BigDecimal calculateTotalDeductions(UUID payslipId) {
        List<PayslipDetail> deductions =
                payslipDetailRepository.findByPayslipIdAndType(payslipId, "DEDUCTION");

        return deductions.stream()
                .map(PayslipDetail::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateNetSalary(BigDecimal gross, BigDecimal deductions) {
        return gross.subtract(deductions);
    }
}
