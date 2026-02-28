package com.project.hrm.config;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.PayrollStatus;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tự động tạo payslip lịch sử (CONFIRMED) cho tất cả nhân viên có
 * SalaryProfile.
 * Chỉ chạy 1 lần — bỏ qua nếu payslip đã tồn tại cho nhân viên đó trong kỳ đó.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HistoricalPayrollSeeder implements ApplicationRunner {

    private final EmployeeRepository employeeRepository;
    private final SalaryProfileRepository salaryProfileRepository;
    private final PayslipRepository payslipRepository;
    private final PayrollPeriodRepository periodRepository;

    // Danh sách kỳ lương cần seed (tháng, năm)
    private static final int[][] SEED_PERIODS = {
            { 11, 2025 },
            { 12, 2025 },
            { 1, 2026 },
    };

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("=== HistoricalPayrollSeeder: Bắt đầu seed payslip lịch sử ===");

        List<Employee> employees = employeeRepository.findAll();
        int seeded = 0;
        int skipped = 0;

        for (int[] periodDef : SEED_PERIODS) {
            int month = periodDef[0];
            int year = periodDef[1];

            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

            // Lấy hoặc tạo PayrollPeriod
            PayrollPeriod period = periodRepository.findByMonthAndYear(month, year)
                    .orElseGet(() -> {
                        PayrollPeriod p = new PayrollPeriod();
                        p.setMonth(month);
                        p.setYear(year);
                        p.setStartDate(startDate);
                        p.setEndDate(endDate);
                        p.setStatus(PayrollStatus.CLOSED);
                        p.setCreatedAt(LocalDateTime.now());
                        return periodRepository.save(p);
                    });

            for (Employee emp : employees) {
                // Bỏ qua nếu đã có payslip cho nhân viên này trong kỳ này
                boolean exists = payslipRepository
                        .findPayslipsWithPeriod(
                                emp.getEmployeeId(),
                                List.of(PayslipStatus.DRAFT, PayslipStatus.CONFIRMED, PayslipStatus.PAID),
                                org.springframework.data.domain.PageRequest.of(0, 100))
                        .stream()
                        .anyMatch(p -> p.getPayrollPeriod() != null
                                && period.getPeriodId().equals(p.getPayrollPeriod().getPeriodId()));

                if (exists) {
                    skipped++;
                    continue;
                }

                // Lấy SalaryProfile
                var profileOpt = salaryProfileRepository.findActiveProfileForPeriod(
                        emp.getEmployeeId(), startDate, endDate);

                if (profileOpt.isEmpty()) {
                    log.debug("  Skip {} — không có SalaryProfile kỳ {}/{}", emp.getFullName(), month, year);
                    continue;
                }

                SalaryProfile profile = profileOpt.get();

                // Tính lương
                BigDecimal baseSalary = orZero(profile.getBaseSalary());

                // Tổng phụ cấp từ JSONB
                BigDecimal totalAllowances = BigDecimal.ZERO;
                if (profile.getAllowances() != null) {
                    for (Object val : profile.getAllowances().values()) {
                        if (val instanceof Number n) {
                            totalAllowances = totalAllowances.add(BigDecimal.valueOf(n.doubleValue()));
                        } else if (val instanceof String s) {
                            try {
                                totalAllowances = totalAllowances.add(new BigDecimal(s));
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }

                BigDecimal grossSalary = baseSalary.add(totalAllowances);
                BigDecimal insuranceAmount = baseSalary.multiply(BigDecimal.valueOf(0.105));
                BigDecimal taxableIncome = grossSalary.subtract(insuranceAmount);
                BigDecimal personalDeduct = BigDecimal.valueOf(11_000_000);
                BigDecimal assessable = taxableIncome.subtract(personalDeduct);
                BigDecimal taxAmount = assessable.compareTo(BigDecimal.ZERO) > 0
                        ? calcTax(assessable)
                        : BigDecimal.ZERO;
                BigDecimal totalDeductions = taxAmount.add(insuranceAmount);
                BigDecimal netSalary = grossSalary.subtract(totalDeductions);
                if (netSalary.compareTo(BigDecimal.ZERO) < 0)
                    netSalary = BigDecimal.ZERO;

                // Tạo payslip
                Payslip payslip = new Payslip();
                payslip.setEmployee(emp);
                payslip.setPayrollPeriod(period);
                payslip.setBaseSalary(baseSalary);
                payslip.setTotalAllowances(totalAllowances);
                payslip.setGrossSalary(grossSalary);
                payslip.setTaxAmount(taxAmount);
                payslip.setInsuranceAmount(insuranceAmount);
                payslip.setTotalDeductions(totalDeductions);
                payslip.setNetSalary(netSalary);
                payslip.setStatus(PayslipStatus.CONFIRMED);
                payslip.setCreatedAt(LocalDateTime.now());
                payslip.setConfirmedAt(LocalDateTime.now());

                // Chi tiết phiếu lương
                List<PayslipDetail> details = new ArrayList<>();
                if (totalAllowances.compareTo(BigDecimal.ZERO) > 0) {
                    details.add(detail(payslip, "Phụ cấp", totalAllowances, (short) 1));
                }
                details.add(detail(payslip, "Bảo hiểm (BHXH+BHYT+BHTN 10.5%)", insuranceAmount, (short) 2));
                if (taxAmount.compareTo(BigDecimal.ZERO) > 0) {
                    details.add(detail(payslip, "Thuế TNCN (lũy tiến)", taxAmount, (short) 2));
                }
                payslip.setDetails(details);

                payslipRepository.save(payslip);
                seeded++;
                log.info("  ✓ Payslip {}/{} → {} | Net: {}", month, year, emp.getFullName(), netSalary);
            }
        }

        log.info("=== HistoricalPayrollSeeder hoàn tất: {} payslip đã tạo, {} đã bỏ qua ===", seeded, skipped);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private static BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static PayslipDetail detail(Payslip p, String name, BigDecimal amount, short type) {
        PayslipDetail d = new PayslipDetail();
        d.setPayslip(p);
        d.setItemName(name);
        d.setAmount(amount);
        d.setType(type);
        d.setCreatedAt(LocalDateTime.now());
        return d;
    }

    private static BigDecimal calcTax(BigDecimal assessable) {
        double income = assessable.doubleValue();
        double tax;
        if (income <= 5_000_000)
            tax = income * 0.05;
        else if (income <= 10_000_000)
            tax = income * 0.10 - 250_000;
        else if (income <= 18_000_000)
            tax = income * 0.15 - 750_000;
        else if (income <= 32_000_000)
            tax = income * 0.20 - 1_650_000;
        else if (income <= 52_000_000)
            tax = income * 0.25 - 3_250_000;
        else if (income <= 80_000_000)
            tax = income * 0.30 - 5_850_000;
        else
            tax = income * 0.35 - 9_850_000;
        return BigDecimal.valueOf(Math.max(tax, 0));
    }
}
