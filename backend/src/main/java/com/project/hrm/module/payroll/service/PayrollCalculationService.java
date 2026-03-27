package com.project.hrm.module.payroll.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.PayrollBatchStatus;
import com.project.hrm.module.payroll.enums.PayslipDetailType;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.*;
import com.project.hrm.module.payroll.util.VietnamPublicHoliday;
import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.attendance.dto.AttendanceAggregationDTO;
import com.project.hrm.module.attendance.entity.AttendanceLog;
import com.project.hrm.module.attendance.enums.AttendanceStatus;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.entity.PerformanceReviews;
import com.project.hrm.module.evaluation.enums.CycleStatus;
import com.project.hrm.module.payroll.enums.BenefitType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Service chịu trách nhiệm tính toán lương cho từng nhân viên trong một batch.
 * Logic: Đọc salary_profile → lấy config thuế/bảo hiểm → tính gross → tính net
 * → lưu payslip.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollCalculationService {

    private final PayrollBatchRepository batchRepository;
    private final PayslipRepository payslipRepository;
    private final SalaryProfileRepository salaryProfileRepository;
    private final TaxConfigRepository taxConfigRepository;
    private final InsuranceConfigRepository insuranceConfigRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final PerformanceCyclesRepository performanceCyclesRepository;
    private final PerformanceReviewsRepository performanceReviewsRepository;
    private final EmployeeBenefitRepository employeeBenefitRepository;

    /**
     * Chạy lương cho toàn bộ nhân viên trong một batch.
     * Mỗi nhân viên sẽ được tạo 1 payslip DRAFT.
     * Gọi từ HR sau khi tạo batch.
     *
     * @param batchId     ID của batch cần chạy
     * @param employeeIds Danh sách nhân viên cần tính lương
     */
    @Transactional
    public List<Payslip> calculateBatch(UUID batchId, List<UUID> employeeIds) {
        PayrollBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch không tồn tại: " + batchId));

        if (batch.getStatus() != PayrollBatchStatus.DRAFT && batch.getStatus() != PayrollBatchStatus.VALIDATED) {
            throw new PayrollException("Batch không ở trạng thái DRAFT hoặc VALIDATED, không thể tính lương lại.");
        }

        // Xóa các payslip cũ trong batch (nếu có) để tránh lỗi Duplicate Key
        payslipRepository.deleteAllByBatch_BatchId(batchId);

        LocalDate calculationDate = batch.getPeriod().getEndDate();
        LocalDate startDate = batch.getPeriod().getStartDate();
        List<Payslip> results = new ArrayList<>();

        // 1. Lấy dữ liệu điểm danh
        List<AttendanceAggregationDTO> allAttendances = attendanceLogRepository.aggregateAttendanceByPeriod(startDate,
                calculationDate);

        // 2. Lấy dữ liệu Đánh giá KPI (Tìm Cycle gần nhất đang CLOSED hoặc ACTIVE)
        PerformanceCycles currentCycle = performanceCyclesRepository
                .findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED)
                .orElse(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE)
                        .orElse(null));

        for (UUID employeeId : employeeIds) {
            try {
                AttendanceAggregationDTO attendance = allAttendances.stream()
                        .filter(a -> a.getEmployeeId().equals(employeeId))
                        .findFirst()
                        .orElse(new AttendanceAggregationDTO(employeeId, BigDecimal.ZERO, BigDecimal.ZERO, 0L));

                double kpiScore = 0.0;
                if (currentCycle != null) {
                    PerformanceReviews review = performanceReviewsRepository
                            .findByEmployee_EmployeeIdAndCycle_CycleId(employeeId, currentCycle.getCycleId())
                            .orElse(null);
                    if (review != null && review.getKpiScore() != null) {
                        kpiScore = review.getKpiScore();
                    }
                }

                Payslip payslip = calculateForEmployee(batch, employeeId, attendance, kpiScore, startDate,
                        calculationDate);
                results.add(payslipRepository.save(payslip));
                log.info("Tính lương thành công cho nhân viên {} trong batch {}", employeeId, batchId);
            } catch (Exception e) {
                log.error("Lỗi tính lương nhân viên {} trong batch {}: {}", employeeId, batchId, e.getMessage());
                // Tiếp tục xử lý các nhân viên còn lại, không dừng toàn bộ batch
            }
        }

        // Trạng thái Batch không còn tự động chuyển sang VALIDATED ở đây.
        // Nó sẽ giữ nguyên là DRAFT và chỉ chuyển sang VALIDATED khi HR duyệt tất cả các phiếu lương.

        return results;
    }

    private Payslip calculateForEmployee(PayrollBatch batch, UUID employeeId,
            AttendanceAggregationDTO attendance, double kpiScore,
            LocalDate startDate, LocalDate calculationDate) {
        // 1. Lấy hồ sơ lương đang hiệu lực
        SalaryProfile profile = salaryProfileRepository
                .findActiveByEmployeeIdAndDate(employeeId, calculationDate)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy hồ sơ lương cho nhân viên: " + employeeId));

        BigDecimal baseSalary = profile.getBaseSalary();

        // 2. Định nghĩa số công chuẩn của tháng (22 hoặc 20/21 cho tháng 2)
        int standardWorkingDays = 22;
        if (startDate.getMonthValue() == 2) {
            standardWorkingDays = startDate.isLeapYear() ? 21 : 20;
        }

        // 3. Tính OT pay (OT = 1.5x lương giờ)
        BigDecimal hourlyRate = baseSalary.divide(BigDecimal.valueOf(standardWorkingDays * 8L), 2,
                RoundingMode.HALF_UP);
        BigDecimal otPay = hourlyRate.multiply(BigDecimal.valueOf(1.5))
                .multiply(attendance.getTotalOtHours())
                .setScale(2, RoundingMode.HALF_UP);

        // 4. Lọc và tính khấu trừ theo giờ thực tế cho các trạng thái đi muộn, về sớm,
        // thiếu thẻ
        List<AttendanceLog> periodLogs = attendanceLogRepository.findByEmployeeIdAndDateBetween(employeeId, startDate,
                calculationDate);
        Set<LocalDate> publicHolidays = VietnamPublicHoliday.getHolidays(startDate.getYear());

        BigDecimal totalShortfallHours = BigDecimal.ZERO;
        for (AttendanceLog attLog : periodLogs) {
            if (!publicHolidays.contains(attLog.getDate())) {
                AttendanceStatus status = attLog.getStatus();
                if (status == AttendanceStatus.LATE ||
                        status == AttendanceStatus.EARLY_LEAVE ||
                        status == AttendanceStatus.LATE_EARLY ||
                        status == AttendanceStatus.MISSING_PUNCH) {

                    BigDecimal working = attLog.getWorkingHours() != null ? attLog.getWorkingHours() : BigDecimal.ZERO;
                    BigDecimal shortfall = BigDecimal.valueOf(8.0).subtract(working);
                    if (shortfall.compareTo(BigDecimal.ZERO) > 0) {
                        totalShortfallHours = totalShortfallHours.add(shortfall);
                    }
                }
            }
        }

        BigDecimal absentDeduction = hourlyRate.multiply(totalShortfallHours)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalAbsentEquivalent = totalShortfallHours.divide(BigDecimal.valueOf(8), 2, RoundingMode.HALF_UP);

        log.info("Nhân viên {}: Thiếu tổng cộng {} giờ làm việc (không tính ngày lễ), khấu trừ: {}",
                employeeId, totalShortfallHours, absentDeduction);

        // 5. Thưởng KPI
        BigDecimal kpiBonus = BigDecimal.ZERO;
        if (kpiScore >= 80.0) {
            kpiBonus = BigDecimal.valueOf(2000000);
        }

        // 5.5 FETCH DYNAMIC BENEFITS
        List<EmployeeBenefit> activeBenefits = employeeBenefitRepository.findActiveBenefitsForPeriod(employeeId,
                startDate, calculationDate);
        BigDecimal dynamicAllowances = BigDecimal.ZERO;
        for (EmployeeBenefit eb : activeBenefits) {
            if (eb.getBenefit().getBenefitType() == BenefitType.ALLOWANCE) {
                BigDecimal value = eb.getAppliedValue() != null ? eb.getAppliedValue()
                        : eb.getBenefit().getStandardValue();
                if (value != null) {
                    dynamicAllowances = dynamicAllowances.add(value);
                }
            }
        }

        // tổng phụ cấp từ profile + dynamic benefits + KPI
        BigDecimal totalAllowances = kpiBonus.add(dynamicAllowances);

        // 6. Tính gross
        BigDecimal grossSalary = baseSalary.add(otPay).add(totalAllowances).subtract(absentDeduction);

        // 7. Lấy tỷ lệ thuế & bảo hiểm theo ngày hiệu lực
        BigDecimal taxRate = BigDecimal.ZERO;
        BigDecimal insuranceRate = BigDecimal.ZERO;

        // Nếu Employee đã Resigned hoặc ngày end_date trong kỳ lương nhỏ hơn ngày nghỉ
        // -> nghỉ giữa chừng -> Không đóng Thuế/BH.
        Employee employee = profile.getEmployee();
        boolean isResignedMidMonth = employee.getStatus() == EmployeeStatus.RESIGNED;

        if (!isResignedMidMonth) {
            if (profile.getTaxCode() != null) {
                taxRate = taxConfigRepository
                        .findActiveByCodeAndDate(profile.getTaxCode(), calculationDate)
                        .map(t -> t.getTaxPercentage().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                        .orElse(BigDecimal.ZERO);
            }
            if (profile.getInsuranceCode() != null) {
                insuranceRate = insuranceConfigRepository
                        .findActiveByCodeAndDate(profile.getInsuranceCode(), calculationDate)
                        .map(i -> i.getInsurancePercentage().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                        .orElse(BigDecimal.ZERO);
            }
        }

        // Tiền OT được loại trừ khỏi tính thuế và bảo hiểm
        BigDecimal taxableIncome = grossSalary.subtract(otPay).max(BigDecimal.ZERO);
        BigDecimal taxAmount = taxableIncome.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal insuranceAmount = taxableIncome.multiply(insuranceRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalDeductions = taxAmount.add(insuranceAmount);
        BigDecimal netSalary = grossSalary.subtract(totalDeductions);

        Payslip payslip = Payslip.builder()
                .batch(batch)
                .period(batch.getPeriod())
                .employee(employee)
                .totalOtHours(attendance.getTotalOtHours())
                .totalAbsentDays(totalAbsentEquivalent)
                .baseSalary(baseSalary)
                .otPay(otPay)
                .absentDeduction(absentDeduction)
                .totalAllowances(totalAllowances)
                .grossSalary(grossSalary)
                .taxAmount(taxAmount)
                .insuranceAmount(insuranceAmount)
                .totalDeductions(totalDeductions)
                .netSalary(netSalary)
                .build();

        // Thêm payslip_details
        List<PayslipDetail> details = new ArrayList<>();
        if (kpiBonus.compareTo(BigDecimal.ZERO) > 0) {
            details.add(PayslipDetail.builder()
                    .payslip(payslip).itemName("Thưởng KPI")
                    .amount(kpiBonus).type(PayslipDetailType.ALLOWANCE).build());
        }
        if (taxAmount.compareTo(BigDecimal.ZERO) > 0) {
            details.add(PayslipDetail.builder()
                    .payslip(payslip).itemName("Thuế TNCN (" + profile.getTaxCode() + ")")
                    .amount(taxAmount).type(PayslipDetailType.DEDUCTION).build());
        }
        if (insuranceAmount.compareTo(BigDecimal.ZERO) > 0) {
            details.add(PayslipDetail.builder()
                    .payslip(payslip).itemName("Bảo hiểm (" + profile.getInsuranceCode() + ")")
                    .amount(insuranceAmount).type(PayslipDetailType.DEDUCTION).build());
        }
        if (otPay.compareTo(BigDecimal.ZERO) > 0) {
            details.add(PayslipDetail.builder()
                    .payslip(payslip).itemName("Lương tăng ca")
                    .amount(otPay).type(PayslipDetailType.ALLOWANCE).build());
        }

        // Thêm các khoản phụ cấp động vào bảng chi tiết phiếu lương
        for (EmployeeBenefit eb : activeBenefits) {
            if (eb.getBenefit().getBenefitType() == BenefitType.ALLOWANCE) {
                BigDecimal value = eb.getAppliedValue() != null ? eb.getAppliedValue()
                        : eb.getBenefit().getStandardValue();
                if (value != null && value.compareTo(BigDecimal.ZERO) > 0) {
                    details.add(PayslipDetail.builder()
                            .payslip(payslip).itemName(eb.getBenefit().getName())
                            .amount(value).type(PayslipDetailType.ALLOWANCE).build());
                }
            }
        }

        payslip.setDetails(details);

        return payslip;
    }
}