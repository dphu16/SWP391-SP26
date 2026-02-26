package com.project.hrm.payroll.compensation.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.payroll.common.enums.PayslipStatus;
import com.project.hrm.payroll.compensation.entity.PayrollPeriods;
import com.project.hrm.payroll.compensation.entity.Payslip;
import com.project.hrm.payroll.compensation.entity.SalaryProfile;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class PayrollCalculatorService {

    public Payslip calculate(
            Employee emp,
            SalaryProfile profile,
            PayrollPeriods period,
            BigDecimal taxPercent,
            BigDecimal insurancePercent
    ) {

        BigDecimal base = profile.getBaseSalary();

        BigDecimal allowanceTotal = profile.getAllowances().values()
                .stream()
                .map(v -> new BigDecimal(v.toString()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal gross = base.add(allowanceTotal);

        BigDecimal tax = gross.multiply(taxPercent)
                .divide(BigDecimal.valueOf(100));

        BigDecimal insurance = gross.multiply(insurancePercent)
                .divide(BigDecimal.valueOf(100));

        BigDecimal totalDeductions = tax.add(insurance);
        BigDecimal net = gross.subtract(totalDeductions);

        return Payslip.builder()
                .employeeId(emp.getEmployeeId())
                .periodId(period.getPeriodId())
                .baseSalary(base)
                .totalAllowances(allowanceTotal)
                .grossSalary(gross)
                .taxAmount(tax)
                .insuranceAmount(insurance)
                .totalDeductions(totalDeductions)
                .netSalary(net)
                .status(PayslipStatus.DRAFT)
                .build();
    }
}
