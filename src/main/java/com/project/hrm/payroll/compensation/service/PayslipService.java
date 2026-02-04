package com.project.hrm.payroll.compensation.service;

import com.project.hrm.payroll.compensation.entity.Payslip;

import com.project.hrm.payroll.compensation.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PayslipService {

    private final PayslipRepository payslipRepository;
    private final SalaryCalculationService salaryCalculationService;

//    public Payslip createPayslip(UUID employeeId, UUID periodId) {
//
//        BigDecimal gross =
//                salaryCalculationService.calculateGrossSalary(employeeId);
//
//        BigDecimal deductions = BigDecimal.ZERO;
//
//        BigDecimal net =
//                salaryCalculationService.calculateNetSalary(gross, deductions);
//
//        Payslip payslip = new Payslip();
//        payslip.setEmployeeId(employeeId);
//        payslip.setPeriodId(periodId);
//        payslip.setGrossSalary(gross);
//        payslip.setTotalDeductions(deductions);
//        payslip.setNetSalary(net);
//
//        return payslipRepository.save(payslip);
//    }
}


