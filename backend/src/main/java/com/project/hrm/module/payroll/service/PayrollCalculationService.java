package com.project.hrm.module.payroll.service;

import com.project.hrm.module.attendance.dto.AttendanceAggregationDTO;
import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.BatchStatus;
import com.project.hrm.module.payroll.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollCalculationService {

    private final PayrollBatchRepository batchRepository;
    private final AttendanceLogRepository attendanceRepository;
    private final SalaryProfileRepository profileRepository;
    private final PayrollDetailRepository payrollDetailRepository;
    private final EmployeeRepository employeeRepository;
    private final PayslipRepository payslipRepository;
    private final PayrollPeriodRepository periodRepository;

    @Transactional
    public void calculatePayrollForBatch(UUID batchId) {
        PayrollBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        if (batch.getStatus() == BatchStatus.LOCKED) {
            throw new RuntimeException("Cannot recalculate a locked batch. Please contact administrator.");
        }

        LocalDate startDate = batch.getPeriod().withDayOfMonth(1);
        LocalDate endDate = batch.getPeriod().withDayOfMonth(batch.getPeriod().lengthOfMonth());

        // Tìm hoặc tạo `PayrollPeriod` cho batch này (Dùng tháng/năm của batch)
        PayrollPeriod payrollPeriod = periodRepository
                .findByMonthAndYear(batch.getPeriod().getMonthValue(), batch.getPeriod().getYear())
                .orElseGet(() -> {
                    PayrollPeriod p = new PayrollPeriod();
                    p.setMonth(batch.getPeriod().getMonthValue());
                    p.setYear(batch.getPeriod().getYear());
                    p.setStartDate(startDate);
                    p.setEndDate(endDate);
                    p.setStatus(com.project.hrm.module.payroll.enums.PayrollStatus.OPEN);
                    p.setCreatedAt(java.time.LocalDateTime.now());
                    return periodRepository.save(p);
                });

        // Xoá phiếu lương cũ của kỳ này nếu đang tính lại để không bị đúp
        payslipRepository.deleteByPayrollPeriod_PeriodId(payrollPeriod.getPeriodId());

        // Lấy dữ liệu chấm công tổng hợp
        List<AttendanceAggregationDTO> attendanceData = attendanceRepository
                .aggregateAttendanceByPeriod(startDate, endDate);
        Map<UUID, AttendanceAggregationDTO> attendanceMap = attendanceData.stream()
                .collect(Collectors.toMap(AttendanceAggregationDTO::getEmployeeId, Function.identity()));

        List<Employee> employees = employeeRepository.findAll();

        for (Employee emp : employees) {
            SalaryProfile profile = profileRepository
                    .findActiveProfileForPeriod(emp.getEmployeeId(), startDate, endDate)
                    .orElse(null);

            if (profile == null)
                continue;

            AttendanceAggregationDTO att = attendanceMap.getOrDefault(
                    emp.getEmployeeId(),
                    new AttendanceAggregationDTO(emp.getEmployeeId(), BigDecimal.ZERO, BigDecimal.ZERO, 0L));

            // Xóa detail cũ nếu có (tính lại)
            // Tính toán Lương Cơ Bản & Phụ Cấp
            BigDecimal baseSalary = profile.getBaseSalary() != null ? profile.getBaseSalary() : BigDecimal.ZERO;
            BigDecimal totalAllowances = BigDecimal.ZERO;
            if (profile.getAllowances() != null) {
                for (Object value : profile.getAllowances().values()) {
                    if (value instanceof Number) {
                        totalAllowances = totalAllowances.add(BigDecimal.valueOf(((Number) value).doubleValue()));
                    } else if (value instanceof String) {
                        try {
                            totalAllowances = totalAllowances.add(new BigDecimal((String) value));
                        } catch (Exception ignored) {
                        }
                    }
                }
            }

            // Không cần tính daily/hourly salary nữa do đã fixed OT và Absence r

            // Vắng mặt (Cố định trừ 400.000 VNĐ / ngày)
            BigDecimal absentDays = BigDecimal.valueOf(att.getTotalAbsentDays());
            BigDecimal absentDeduction = absentDays.multiply(BigDecimal.valueOf(400000));

            // OT (Giả định fixed 200.000 VNĐ / giờ)
            BigDecimal otHours = att.getTotalOtHours() != null ? att.getTotalOtHours() : BigDecimal.ZERO;
            BigDecimal otPay = otHours.multiply(BigDecimal.valueOf(200000));

            // Gross Salary
            BigDecimal grossSalary = baseSalary.add(totalAllowances).add(otPay).subtract(absentDeduction);
            if (grossSalary.compareTo(BigDecimal.ZERO) < 0)
                grossSalary = BigDecimal.ZERO;

            // Bảo hiểm (BHXH, BHYT, BHTN): 10.5% của Lương cơ bản hiện tại ở VN
            // Dùng fixed 10.5% hoặc fetch từ config nếu có (sẽ dùng 10.5% mặc định cho
            // Employee)
            BigDecimal insuranceAmount = baseSalary.multiply(BigDecimal.valueOf(0.105));

            // Thuế TNCN (Progressive Tax)
            // Thu nhập chịu thuế = Gross - Bảo Hiểm
            BigDecimal taxableIncome = grossSalary.subtract(insuranceAmount);
            // Giảm trừ gia cảnh (Cá nhân 11M, chưa tính người phụ thuộc 4.4M)
            BigDecimal personalDeduction = BigDecimal.valueOf(11_000_000);
            BigDecimal assessableIncome = taxableIncome.subtract(personalDeduction);

            BigDecimal taxAmount = BigDecimal.ZERO;
            if (assessableIncome.compareTo(BigDecimal.ZERO) > 0) {
                taxAmount = calculatePersonalIncomeTax(assessableIncome);
            }

            // Lương Thực Nhận (Net Salary)
            BigDecimal netSalary = grossSalary.subtract(insuranceAmount).subtract(taxAmount);
            if (netSalary.compareTo(BigDecimal.ZERO) < 0)
                netSalary = BigDecimal.ZERO;

            PayrollDetail detail = new PayrollDetail();
            detail.setPayrollBatch(batch);
            detail.setEmployee(emp);

            // Populating initial values before final calculation
            detail.setBaseSalary(baseSalary);
            detail.setTotalOtHours(otHours);
            detail.setTotalAbsentDays(absentDays);

            recalculateDetailValues(detail, totalAllowances);

            payrollDetailRepository.save(detail);

            // Tự động tạo Payslip chi tiết cho nhân viên
            Payslip payslip = new Payslip();
            payslip.setEmployee(emp);
            payslip.setPayrollPeriod(payrollPeriod);
            payslip.setBaseSalary(detail.getBaseSalary());
            payslip.setTotalAllowances(totalAllowances);
            payslip.setStatus(com.project.hrm.module.payroll.enums.PayslipStatus.DRAFT);
            payslip.setCreatedAt(java.time.LocalDateTime.now());

            recalculatePayslipValues(payslip, detail);

            payslipRepository.save(payslip);
        }

        // Đánh dấu batch đã được tính toán xong → chờ HR review & approve
        batch.setStatus(BatchStatus.PROCESSED);
        batch.setProcessedAt(java.time.LocalDateTime.now());
        batchRepository.save(batch);

    }

    /**
     * Khối logic dùng chung để tính toán lại giá trị của Detail dựa trên các inputs
     * như BaseSalary, OT Hours, Absent Days.
     */
    public void recalculateDetailValues(PayrollDetail detail, BigDecimal totalAllowances) {
        BigDecimal baseSalary = detail.getBaseSalary() != null ? detail.getBaseSalary() : BigDecimal.ZERO;

        // Không cần tính daily/hourly salary nữa do đã fixed OT và Absence r

        // Vắng mặt (tự động hoặc HR sửa tay, cố định trừ 400.000 VNĐ/ngày)
        BigDecimal absentDays = detail.getTotalAbsentDays() != null ? detail.getTotalAbsentDays() : BigDecimal.ZERO;
        BigDecimal absentDeduction = absentDays.multiply(BigDecimal.valueOf(400000));
        detail.setAbsentDeduction(absentDeduction);

        // OT (tự động hoặc HR sửa tay, cố định 200.000 VNĐ/giờ)
        BigDecimal otHours = detail.getTotalOtHours() != null ? detail.getTotalOtHours() : BigDecimal.ZERO;
        BigDecimal otPay = otHours.multiply(BigDecimal.valueOf(200000));
        detail.setOtPay(otPay);

        // Gross Salary - Lưu ý nếu ng dùng override tay bằng "grossSalaryAdjustment"
        // thì ta sẽ check logic ở ngoài,
        // ở bên trong hàm này ta luôn tự tính
        BigDecimal grossSalary = baseSalary.add(totalAllowances).add(otPay).subtract(absentDeduction);
        if (grossSalary.compareTo(BigDecimal.ZERO) < 0) {
            grossSalary = BigDecimal.ZERO;
        }
        detail.setGrossSalary(grossSalary);

        // Tính thuế và net salary (vì Detail cũng đang lưu netSalary phục vụ report)
        recalculateTaxesAndNet(detail);
    }

    // Tách riêng bước tính thuế
    public void recalculateTaxesAndNet(PayrollDetail detail) {
        // Bảo hiểm (BHXH, BHYT, BHTN): 10.5% của Lương cơ bản hiện tại ở VN
        BigDecimal insuranceAmount = detail.getBaseSalary().multiply(BigDecimal.valueOf(0.105));

        // Thuế TNCN (Progressive Tax)
        BigDecimal taxableIncome = detail.getGrossSalary().subtract(insuranceAmount);
        BigDecimal personalDeduction = BigDecimal.valueOf(11_000_000);
        BigDecimal assessableIncome = taxableIncome.subtract(personalDeduction);

        BigDecimal taxAmount = BigDecimal.ZERO;
        if (assessableIncome.compareTo(BigDecimal.ZERO) > 0) {
            taxAmount = calculatePersonalIncomeTax(assessableIncome);
        }

        BigDecimal netSalary = detail.getGrossSalary().subtract(insuranceAmount).subtract(taxAmount);
        if (netSalary.compareTo(BigDecimal.ZERO) < 0)
            netSalary = BigDecimal.ZERO;

        detail.setNetSalary(netSalary);
    }

    /**
     * Dùng chung để re-build tờ Payslip thực tế mà employee sẽ xem
     */
    public void recalculatePayslipValues(Payslip payslip, PayrollDetail updatedDetail) {
        BigDecimal totalAllowances = payslip.getTotalAllowances() != null ? payslip.getTotalAllowances()
                : BigDecimal.ZERO;

        payslip.setGrossSalary(updatedDetail.getGrossSalary());

        // Tính lại y như detail
        BigDecimal insuranceAmount = updatedDetail.getBaseSalary().multiply(BigDecimal.valueOf(0.105));

        BigDecimal taxableIncome = updatedDetail.getGrossSalary().subtract(insuranceAmount);
        BigDecimal personalDeduction = BigDecimal.valueOf(11_000_000);
        BigDecimal assessableIncome = taxableIncome.subtract(personalDeduction);
        BigDecimal taxAmount = BigDecimal.ZERO;

        if (assessableIncome.compareTo(BigDecimal.ZERO) > 0) {
            taxAmount = calculatePersonalIncomeTax(assessableIncome);
        }

        payslip.setTaxAmount(taxAmount);
        payslip.setInsuranceAmount(insuranceAmount);

        BigDecimal absentDeduction = updatedDetail.getAbsentDeduction() != null ? updatedDetail.getAbsentDeduction()
                : BigDecimal.ZERO;
        BigDecimal totalDeductions = taxAmount.add(insuranceAmount).add(absentDeduction);

        payslip.setTotalDeductions(totalDeductions);
        payslip.setNetSalary(updatedDetail.getNetSalary());

        // Cập nhật lại list details
        java.util.List<PayslipDetail> pDetails = new java.util.ArrayList<>();

        BigDecimal otPay = updatedDetail.getOtPay() != null ? updatedDetail.getOtPay() : BigDecimal.ZERO;

        if (otPay.compareTo(BigDecimal.ZERO) > 0) {
            pDetails.add(new PayslipDetail(null, payslip, "Overtime Pay", otPay, (short) 1,
                    java.time.LocalDateTime.now()));
        }
        if (totalAllowances.compareTo(BigDecimal.ZERO) > 0) {
            pDetails.add(new PayslipDetail(null, payslip, "Total Allowances", totalAllowances, (short) 1,
                    java.time.LocalDateTime.now()));
        }
        if (absentDeduction.compareTo(BigDecimal.ZERO) > 0) {
            pDetails.add(new PayslipDetail(null, payslip, "Absent Deduction", absentDeduction, (short) 2,
                    java.time.LocalDateTime.now()));
        }

        // JPA Cascade xoá cũ thêm mới (nếu entity setup hỗ trợ), nhưng ở đây có 1 cách
        // dùng clear r addAll
        if (payslip.getDetails() != null) {
            payslip.getDetails().clear();
            payslip.getDetails().addAll(pDetails);
        } else {
            payslip.setDetails(pDetails);
        }
    }

    /**
     * Tính thuế TNCN theo biểu thuế lũy tiến từng phần của Việt Nam
     */
    private BigDecimal calculatePersonalIncomeTax(BigDecimal assessableIncome) {
        double income = assessableIncome.doubleValue();
        double tax = 0;

        if (income <= 5_000_000) {
            tax = income * 0.05;
        } else if (income <= 10_000_000) {
            tax = income * 0.10 - 250_000;
        } else if (income <= 18_000_000) {
            tax = income * 0.15 - 750_000;
        } else if (income <= 32_000_000) {
            tax = income * 0.20 - 1_650_000;
        } else if (income <= 52_000_000) {
            tax = income * 0.25 - 3_250_000;
        } else if (income <= 80_000_000) {
            tax = income * 0.30 - 5_850_000;
        } else {
            tax = income * 0.35 - 9_850_000;
        }
        return BigDecimal.valueOf(Math.max(tax, 0));
    }
}
