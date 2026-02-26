package com.project.hrm.module.payroll.compensation.service;


import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.common.enums.PayslipStatus;
import com.project.hrm.module.payroll.common.enums.PeriodStatus;
import com.project.hrm.module.payroll.compensation.entity.*;
import com.project.hrm.module.payroll.compensation.repository.*;
import com.project.hrm.payroll.compensation.entity.*;
import com.project.hrm.payroll.compensation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PayrollService {
    private final PayrollCalculatorService calculator;
    private final PayslipRepository payslipRepository;
    private final SalaryProfileRepository salaryProfileRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    private final EmployeeRepository employeeRepository;
    private final TaxConfigRepository taxConfigRepository;
    private final InsuranceConfigRepository insuranceConfigRepository;

    @Transactional
    public void runPayroll(UUID periodId){
        var period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (!"OPEN".equals(String.valueOf(period.getStatus()))) {
            throw new RuntimeException("Payroll period is not OPEN");
        }

        var employees = employeeRepository.findAll();
        for(var emp: employees){
            var salaryProfile = salaryProfileRepository
                    .findActiveProfile(emp.getEmployeeId(), period.getStartDate(), period.getEndDate());
            if (salaryProfile.isEmpty()) {
                System.out.println("Bỏ qua nhân viên: " + emp.getEmployeeId() + " (Chưa có Salary Profile)");
                continue;
            }

            var profile = salaryProfile.get();
            BigDecimal baseSalary = profile.getBaseSalary();

            // Tính tổng phụ cấp (Ăn trưa, xăng xe...) từ JSON Map
            BigDecimal totalAllowances = calculateTotalAllowances(profile.getAllowances());

            // Tổng thu nhập (Gross) = Lương cứng + Phụ cấp
            BigDecimal grossSalary = baseSalary.add(totalAllowances);

            // Khấu trừ (Giả sử 10% trên lương cứng theo logic cũ của bạn)
            BigDecimal deductions = baseSalary.multiply(BigDecimal.valueOf(0.1));

            // Thực nhận (Net) = Tổng thu nhập - Khấu trừ
            BigDecimal netSalary = grossSalary.subtract(deductions);

            Payslip payslip = Payslip.builder()
                    .employeeId(emp.getEmployeeId())
                    .periodId(periodId)
                    .grossSalary(grossSalary)
                    .totalDeductions(deductions)
                    .netSalary(netSalary)
                    .status(PayslipStatus.DRAFT)
                    .createdAt(OffsetDateTime.now())
                    .updatedAt(OffsetDateTime.now())
                    .build();

            payslipRepository.save(payslip);
        }
    }

    private BigDecimal calculateTotalAllowances(Map<String, Object> allowances) {
        if (allowances == null || allowances.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = BigDecimal.ZERO;
        for (Object value : allowances.values()) {
            try {
                BigDecimal amount = new BigDecimal(String.valueOf(value));
                total = total.add(amount);
            } catch (Exception e) {
            }
        }
        return total;
    }

    @Transactional
    public void generatePayslips(UUID periodId) {

        PayrollPeriods period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (period.getStatus().equals(PeriodStatus.CLOSED)) {
            throw new RuntimeException("Period is locked");
        }

        List<Employee> employees = employeeRepository.findAllActive();

        for (Employee emp : employees) {

            // tránh generate trùng
            if (payslipRepository.existsByEmployeeIdAndPeriodId(emp.getEmployeeId(), periodId)) {
                continue;
            }

            SalaryProfile profile = salaryProfileRepository.findActiveProfile(
                    emp.getEmployeeId(),
                    period.getStartDate(),
                    period.getEndDate()
            ).orElseThrow(() ->
                    new RuntimeException("No salary profile for employee " + emp.getEmployeeId())
            );

            TaxConfig tax = taxConfigRepository.findActiveTax(
                    profile.getTaxCode(),
                    period.getStartDate(),
                    period.getEndDate()
            ).orElseThrow(() ->
                    new RuntimeException("Tax config not found")
            );

            InsuranceConfig insurance = insuranceConfigRepository.findActiveInsurance(
                    profile.getInsuranceCode(),
                    period.getStartDate(),
                    period.getEndDate()
            ).orElseThrow(() ->
                    new RuntimeException("Insurance config not found")
            );

            Payslip payslip = calculator.calculate(
                    emp,
                    profile,
                    period,
                    tax.getTaxPercentage(),
                    insurance.getInsurancePercentage()
            );

            payslipRepository.save(payslip);
        }
    }
}


