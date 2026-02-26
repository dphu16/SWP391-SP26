package com.project.hrm.module.payroll.service;


import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
<<<<<<< HEAD:backend/src/main/java/com/project/hrm/module/payroll/compensation/service/PayrollService.java
import com.project.hrm.module.payroll.common.enums.PayslipStatus;
import com.project.hrm.module.payroll.common.enums.PeriodStatus;
import com.project.hrm.module.payroll.compensation.entity.*;
import com.project.hrm.module.payroll.compensation.repository.*;
import com.project.hrm.payroll.common.enums.PayslipStatus;
import com.project.hrm.payroll.common.enums.PayslipType;
import com.project.hrm.payroll.common.enums.PeriodStatus;
import com.project.hrm.payroll.compensation.dto.PayrollAggregateDTO;
import com.project.hrm.payroll.compensation.dto.PayrollSummaryDTO;
import com.project.hrm.payroll.compensation.dto.PayslipItemDTO;
import com.project.hrm.payroll.compensation.dto.ResponseDTO.PayslipDetailResponse;
import com.project.hrm.payroll.compensation.entity.*;
import com.project.hrm.payroll.compensation.repository.*;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.enums.PeriodStatus;
import com.project.hrm.module.payroll.repository.*;
=======
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.enums.PeriodStatus;
import com.project.hrm.module.payroll.repository.*;
>>>>>>> df05727451ef27a28699bbdee957247d77b96b1d:backend/src/main/java/com/project/hrm/module/payroll/service/PayrollService.java
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
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
                    .employee(emp)
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

    @Transactional
    public void confirmAllPayslips(UUID periodId) {

        PayrollPeriods period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (period.getStatus().equals(PeriodStatus.CLOSED)) {
            throw new RuntimeException("Period is locked");
        }

        List<Payslip> payslips = payslipRepository.findByPeriodId(periodId);

        if (payslips.isEmpty()) {
            throw new RuntimeException("No payslips found for this period");
        }

        // Kiểm tra tất cả phải là DRAFT
        for (Payslip p : payslips) {
            if (p.getStatus() != PayslipStatus.DRAFT) {
                throw new RuntimeException("All payslips must be DRAFT to confirm");
            }
        }

        OffsetDateTime now = OffsetDateTime.now();

        for (Payslip p : payslips) {
            p.setStatus(PayslipStatus.CONFIRMED);
            p.setConfirmedAt(now);
        }

        payslipRepository.saveAll(payslips);
    }
    @Transactional
    public void payAllPayslips(UUID periodId) {

        PayrollPeriods period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (period.getStatus().equals(PeriodStatus.CLOSED)) {
            throw new RuntimeException("Period is locked");
        }

        List<Payslip> payslips = payslipRepository.findByPeriodId(periodId);

        if (payslips.isEmpty()) {
            throw new RuntimeException("No payslips found for this period");
        }

        // Tất cả phải CONFIRMED
        for (Payslip p : payslips) {
            if (p.getStatus() != PayslipStatus.CONFIRMED) {
                throw new RuntimeException("All payslips must be CONFIRMED to pay");
            }
        }

        OffsetDateTime now = OffsetDateTime.now();

        for (Payslip p : payslips) {
            p.setStatus(PayslipStatus.PAID);
            p.setPaidAt(now);
        }

        payslipRepository.saveAll(payslips);

        // Lock period sau khi pay xong
        period.setStatus(PeriodStatus.CLOSED);
        payrollPeriodRepository.save(period);
    }

    public PayrollSummaryDTO getSummary(UUID periodId) {

        Object[] result = payslipRepository.getPayrollSummary(periodId);

        if (result == null || result[0] == null) {
            return new PayrollSummaryDTO(
                    0L, 0L, 0L,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            );
        }

        return new PayrollSummaryDTO(
                (Long) result[0],
                result[1] == null ? 0L : ((Long) result[1]),
                result[2] == null ? 0L : ((Long) result[2]),
                result[3] == null ? BigDecimal.ZERO : (BigDecimal) result[3],
                result[4] == null ? BigDecimal.ZERO : (BigDecimal) result[4],
                result[5] == null ? BigDecimal.ZERO : (BigDecimal) result[5]
        );
    }

    public PayrollAggregateDTO getYearlyReport(int year) {

        Object[] result = payslipRepository.getYearlySummary(year);

        return new PayrollAggregateDTO(
                result[0] == null ? BigDecimal.ZERO : (BigDecimal) result[0],
                result[1] == null ? BigDecimal.ZERO : (BigDecimal) result[1],
                result[2] == null ? BigDecimal.ZERO : (BigDecimal) result[2]
        );
    }

    public PayrollAggregateDTO getMonthlyReport(int year, int month) {

        Object[] result = payslipRepository.getMonthlySummary(year, month);

        return new PayrollAggregateDTO(
                result[0] == null ? BigDecimal.ZERO : (BigDecimal) result[0],
                result[1] == null ? BigDecimal.ZERO : (BigDecimal) result[1],
                result[2] == null ? BigDecimal.ZERO : (BigDecimal) result[2]
        );
    }

    public ByteArrayInputStream exportPayslips(UUID periodId) throws IOException {

        List<Payslip> payslips = payslipRepository.findByPeriodId(periodId);

        if (payslips.isEmpty()) {
            throw new RuntimeException("No payslips found");
        }

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Payslips");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Employee");
            header.createCell(1).setCellValue("Gross");
            header.createCell(2).setCellValue("Deductions");
            header.createCell(3).setCellValue("Net");
            header.createCell(4).setCellValue("Status");

            int rowIdx = 1;

            for (Payslip p : payslips) {
                Row row = sheet.createRow(rowIdx++);

                //row.createCell(0).setCellValue(p.getEmployee().getName);
                row.createCell(1).setCellValue(p.getGrossSalary().doubleValue());
                row.createCell(2).setCellValue(p.getTotalDeductions().doubleValue());
                row.createCell(3).setCellValue(p.getNetSalary().doubleValue());
                row.createCell(4).setCellValue(p.getStatus().name());
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
    //roll back confirm to draft
    @Transactional
    public void rollbackConfirmAll(UUID periodId) {

        PayrollPeriods period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (period.getStatus().equals(PeriodStatus.CLOSED)) {
            throw new RuntimeException("Cannot rollback locked period");
        }

        List<Payslip> payslips = payslipRepository.findByPeriodId(periodId);

        for (Payslip p : payslips) {
            if (p.getStatus() == PayslipStatus.PAID) {
                throw new RuntimeException("Cannot rollback. Some payslips already paid.");
            }
        }

        for (Payslip p : payslips) {
            if (p.getStatus() == PayslipStatus.CONFIRMED) {
                p.setStatus(PayslipStatus.DRAFT);
                p.setConfirmedAt(null);
            }
        }

        payslipRepository.saveAll(payslips);
    }


    @Transactional
    public void rollbackPayAll(UUID periodId) {

        PayrollPeriods period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        List<Payslip> payslips = payslipRepository.findByPeriodId(periodId);

        for (Payslip p : payslips) {
            if (p.getStatus() != PayslipStatus.PAID) {
                throw new RuntimeException("All payslips must be PAID to rollback payment");
            }
        }

        for (Payslip p : payslips) {
            p.setStatus(PayslipStatus.CONFIRMED);
            p.setPaidAt(null);
        }

        payslipRepository.saveAll(payslips);

        period.setStatus(PeriodStatus.OPEN);
        payrollPeriodRepository.save(period);
    }
}


