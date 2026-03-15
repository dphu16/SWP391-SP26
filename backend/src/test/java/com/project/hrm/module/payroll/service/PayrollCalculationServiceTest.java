package com.project.hrm.module.payroll.service;

import com.project.hrm.module.attendance.dto.AttendanceAggregationDTO;
import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.entity.PerformanceReviews;
import com.project.hrm.module.evaluation.enums.CycleStatus;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.PayrollBatchStatus;
import com.project.hrm.module.payroll.enums.PayslipDetailType;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho PayrollCalculationService.
 *
 * ══════════════════════════════════════════════════════════
 * GHI CHÚ VỀ LOGIC SERVICE:
 * ══════════════════════════════════════════════════════════
 *
 * RESIGNED check (đúng):
 *   Service: employee.getStatus() == EmployeeStatus.RESIGNED
 *   → isResignedMidMonth = true → không tính thuế/BH.
 *
 * BUG còn lại – .orElse() thay vì .orElseGet() khi tìm cycle:
 *   Service luôn gọi cả CLOSED lẫn ACTIVE dù CLOSED đã tồn tại.
 *   → Test stub cả hai, không assert verify(ACTIVE, never()).
 * ══════════════════════════════════════════════════════════
 *
 * AttendanceAggregationDTO constructor:
 *   (UUID employeeId, BigDecimal totalWorkingHours, BigDecimal totalOtHours, Long totalAbsentDays)
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PayrollCalculationService Tests")
class PayrollCalculationServiceTest {

    @Mock private PayrollBatchRepository      batchRepository;
    @Mock private PayslipRepository           payslipRepository;
    @Mock private SalaryProfileRepository     salaryProfileRepository;
    @Mock private TaxConfigRepository         taxConfigRepository;
    @Mock private InsuranceConfigRepository   insuranceConfigRepository;
    @Mock private AttendanceLogRepository     attendanceLogRepository;
    @Mock private PerformanceCyclesRepository performanceCyclesRepository;
    @Mock private PerformanceReviewsRepository performanceReviewsRepository;

    @InjectMocks
    private PayrollCalculationService payrollCalculationService;

    // ─── Common fixtures ───────────────────────────────────────────────────────
    private UUID           batchId;
    private UUID           employeeId;
    private PayrollBatch   batch;
    private PayrollPeriod  period;
    private SalaryProfile  salaryProfile;
    private Employee       employee;
    private TaxConfig      taxConfig;
    private InsuranceConfig insuranceConfig;

    @BeforeEach
    void setUp() {
        batchId    = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        period = new PayrollPeriod();
        period.setStartDate(LocalDate.of(2025, 3, 1));
        period.setEndDate(LocalDate.of(2025, 3, 31));

        batch = new PayrollBatch();
        batch.setBatchId(batchId);
        batch.setStatus(PayrollBatchStatus.DRAFT);
        batch.setPeriod(period);

        employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setStatus(EmployeeStatus.OFFICIAL);
        // KHÔNG set empStatus (ProgressStatus) – để null, giống thực tế production
        // Service dùng getEmpStatus() để check RESIGNED → null → NPE → BUG 1

        salaryProfile = new SalaryProfile();
        salaryProfile.setEmployee(employee);
        salaryProfile.setBaseSalary(new BigDecimal("10000000"));
        salaryProfile.setTaxCode("TAX01");
        salaryProfile.setInsuranceCode("INS01");

        taxConfig = new TaxConfig();
        taxConfig.setTaxPercentage(new BigDecimal("10"));

        insuranceConfig = new InsuranceConfig();
        insuranceConfig.setInsurancePercentage(new BigDecimal("8"));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HELPER: tạo DTO điểm danh đúng thứ tự constructor
    // AttendanceAggregationDTO(employeeId, totalWorkingHours, totalOtHours, totalAbsentDays)
    // ──────────────────────────────────────────────────────────────────────────
    private AttendanceAggregationDTO attendance(UUID empId,
                                                BigDecimal workHours,
                                                BigDecimal otHours,
                                                long absentDays) {
        return new AttendanceAggregationDTO(empId, workHours, otHours, absentDays);
    }

    /** Stub đầy đủ happy-path: không OT, không vắng, không KPI, empStatus = null (mặc định). */
    private void stubHappyPath(PayrollBatchStatus status) {
        batch.setStatus(status);
        when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
        when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                .thenReturn(List.of(attendance(employeeId, BigDecimal.ZERO, BigDecimal.ZERO, 0L)));
        when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                .thenReturn(Optional.empty());
        when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(salaryProfileRepository.findActiveByEmployeeIdAndDate(eq(employeeId), any()))
                .thenReturn(Optional.of(salaryProfile));
        when(attendanceLogRepository.findAbsentDates(eq(employeeId), any(), any()))
                .thenReturn(List.of());
        when(taxConfigRepository.findActiveByCodeAndDate(any(), any()))
                .thenReturn(Optional.of(taxConfig));
        when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any()))
                .thenReturn(Optional.of(insuranceConfig));
        when(payslipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. BATCH VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. Batch Validation")
    class BatchValidation {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi batch không tồn tại")
        void shouldThrow_WhenBatchNotFound() {
            when(batchRepository.findById(batchId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> payrollCalculationService.calculateBatch(batchId, List.of(employeeId)))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(batchId.toString());
        }

        @Test
        @DisplayName("Throw PayrollException khi batch trạng thái PROCESSED")
        void shouldThrow_WhenBatchStatusIsProcessed() {
            batch.setStatus(PayrollBatchStatus.PROCESSED);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            assertThatThrownBy(() -> payrollCalculationService.calculateBatch(batchId, List.of(employeeId)))
                    .isInstanceOf(PayrollException.class);
        }

        @Test
        @DisplayName("Throw PayrollException khi batch trạng thái LOCKED")
        void shouldThrow_WhenBatchStatusIsLocked() {
            batch.setStatus(PayrollBatchStatus.LOCKED);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            assertThatThrownBy(() -> payrollCalculationService.calculateBatch(batchId, List.of(employeeId)))
                    .isInstanceOf(PayrollException.class);
        }

        @Test
        @DisplayName("Chấp nhận batch trạng thái DRAFT")
        void shouldAccept_WhenBatchStatusIsDraft() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))).hasSize(1);
        }

        @Test
        @DisplayName("Chấp nhận batch trạng thái VALIDATED")
        void shouldAccept_WhenBatchStatusIsValidated() {
            stubHappyPath(PayrollBatchStatus.VALIDATED);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))).hasSize(1);
        }

        @Test
        @DisplayName("Xóa payslip cũ trước khi tính lại")
        void shouldDeleteOldPayslips_BeforeRecalculation() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            verify(payslipRepository).deleteAllByBatch_BatchId(batchId);
        }

        @Test
        @DisplayName("Cập nhật batch status → VALIDATED sau khi có ít nhất 1 payslip thành công")
        void shouldUpdateBatchStatus_ToValidated_AfterSuccess() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.VALIDATED);
            verify(batchRepository, atLeastOnce()).save(batch);
        }

        @Test
        @DisplayName("Không cập nhật batch status khi tất cả nhân viên đều thất bại")
        void shouldNotUpdateBatchStatus_WhenAllEmployeesFail() {
            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any())).thenReturn(List.of());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.empty());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(any(), any()))
                    .thenReturn(Optional.empty());

            List<Payslip> result = payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            assertThat(result).isEmpty();
            verify(batchRepository, never()).save(batch);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. SALARY PROFILE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. Salary Profile")
    class SalaryProfileTests {

        @Test
        @DisplayName("Bỏ qua nhân viên (không throw toàn batch) khi không có salary profile")
        void shouldSkipEmployee_WhenNoSalaryProfile() {
            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any())).thenReturn(List.of());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.empty());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(any(), any()))
                    .thenReturn(Optional.empty());

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))).isEmpty();
        }

        @Test
        @DisplayName("Tính lương đúng baseSalary khi có salary profile hợp lệ")
        void shouldCalculate_WhenValidSalaryProfile() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            List<Payslip> result = payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getBaseSalary()).isEqualByComparingTo("10000000");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. STANDARD WORKING DAYS
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. Standard Working Days")
    class StandardWorkingDaysTests {

        @Test
        @DisplayName("Tháng thường: 22 ngày → gross = baseSalary khi không OT/vắng/KPI")
        void shouldUse22Days_ForNonFebruaryMonth() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getGrossSalary()).isEqualByComparingTo("10000000.00");
        }

        @Test
        @DisplayName("Tháng 2 năm nhuận (2024): 21 ngày công chuẩn")
        void shouldUse21Days_ForLeapYearFebruary() {
            period.setStartDate(LocalDate.of(2024, 2, 1));
            period.setEndDate(LocalDate.of(2024, 2, 29));
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))).hasSize(1);
        }

        @Test
        @DisplayName("Tháng 2 năm thường (2025): 20 ngày công chuẩn")
        void shouldUse20Days_ForNonLeapYearFebruary() {
            period.setStartDate(LocalDate.of(2025, 2, 1));
            period.setEndDate(LocalDate.of(2025, 2, 28));
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))).hasSize(1);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. OVERTIME (OT) CALCULATION
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. Overtime Calculation")
    class OvertimeTests {

        @Test
        @DisplayName("Không có OT: otPay = 0")
        void shouldHaveZeroOtPay_WhenNoOtHours() {
            stubHappyPath(PayrollBatchStatus.DRAFT);
            // attendance(empId, totalWorkingHours=0, totalOtHours=0, absentDays=0)
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of(attendance(employeeId, BigDecimal.ZERO, BigDecimal.ZERO, 0L)));

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getOtPay()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Có 8 giờ OT: otPay = baseSalary/(22×8) × 1.5 × 8 > 0")
        void shouldCalculateOtPay_WhenOtHoursPresent() {
            // ✅ đúng thứ tự: (empId, totalWorkingHours, totalOtHours, absentDays)
            stubHappyPathWithOt(new BigDecimal("8"));

            BigDecimal otPay = payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getOtPay();

            // hourlyRate = 10000000/(22×8) ≈ 56818.18 → otPay = 56818.18 × 1.5 × 8 ≈ 681818.18
            assertThat(otPay).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("OT pay xuất hiện trong payslip details với type = ALLOWANCE")
        void shouldAddOtPayDetail_WhenOtHoursPresent() {
            stubHappyPathWithOt(new BigDecimal("8"));

            List<Payslip> result = payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            assertThat(result.get(0).getDetails()).anyMatch(
                    d -> d.getItemName().contains("tăng ca")
                            && d.getType() == PayslipDetailType.ALLOWANCE);
        }

        @Test
        @DisplayName("grossSalary tăng lên so với baseline khi có OT")
        void shouldGrossIncrease_WhenOtPresent() {
            // Baseline: không OT
            stubHappyPath(PayrollBatchStatus.DRAFT);
            BigDecimal grossNoOt = payrollCalculationService
                    .calculateBatch(batchId, List.of(employeeId)).get(0).getGrossSalary();

            // Reset và stub lại với OT
            reset(batchRepository, payslipRepository, salaryProfileRepository,
                    taxConfigRepository, insuranceConfigRepository,
                    attendanceLogRepository, performanceCyclesRepository);
            stubHappyPathWithOt(new BigDecimal("8"));
            BigDecimal grossWithOt = payrollCalculationService
                    .calculateBatch(batchId, List.of(employeeId)).get(0).getGrossSalary();

            assertThat(grossWithOt).isGreaterThan(grossNoOt);
        }

        // Helper: stub với OT hours ở đúng vị trí thứ 3 của constructor
        private void stubHappyPathWithOt(BigDecimal otHours) {
            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            // ✅ (empId, totalWorkingHours, totalOtHours, absentDays)
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of(attendance(employeeId, BigDecimal.ZERO, otHours, 0L)));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.empty());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(any(), any()))
                    .thenReturn(Optional.of(salaryProfile));
            when(attendanceLogRepository.findAbsentDates(any(), any(), any())).thenReturn(List.of());
            when(taxConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(taxConfig));
            when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(insuranceConfig));
            when(payslipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. ABSENT DEDUCTION
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("5. Absent Deduction")
    class AbsentDeductionTests {

        @Test
        @DisplayName("Không trừ lương khi không có ngày vắng")
        void shouldHaveZeroDeduction_WhenNoAbsentDays() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getAbsentDeduction()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Trừ đúng 2 ngày công khi vắng 2 ngày thường")
        void shouldDeductSalary_WhenAbsentOnWorkingDay() {
            stubAbsent(List.of(LocalDate.of(2025, 3, 10), LocalDate.of(2025, 3, 11)));

            BigDecimal deduction = payrollCalculationService
                    .calculateBatch(batchId, List.of(employeeId)).get(0).getAbsentDeduction();

            // dailyRate = 10000000/22, 2 ngày
            BigDecimal expected = new BigDecimal("10000000")
                    .divide(BigDecimal.valueOf(22), 2, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(2))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            assertThat(deduction).isEqualByComparingTo(expected);
        }

        @Test
        @DisplayName("Không trừ lương khi vắng đúng ngày lễ 30/4")
        void shouldNotDeduct_WhenAbsentOnPublicHoliday() {
            period.setStartDate(LocalDate.of(2025, 4, 1));
            period.setEndDate(LocalDate.of(2025, 4, 30));
            stubAbsent(List.of(LocalDate.of(2025, 4, 30)));

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getAbsentDeduction()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Chỉ trừ ngày thường khi vắng cả ngày lễ lẫn ngày thường")
        void shouldDeductOnlyNonHolidayAbsences_WhenMixed() {
            period.setStartDate(LocalDate.of(2025, 4, 1));
            period.setEndDate(LocalDate.of(2025, 4, 30));
            // 30/4 = lễ (không trừ), 25/4 = ngày thường (trừ)
            stubAbsent(List.of(LocalDate.of(2025, 4, 30), LocalDate.of(2025, 4, 25)));

            BigDecimal deduction = payrollCalculationService
                    .calculateBatch(batchId, List.of(employeeId)).get(0).getAbsentDeduction();

            BigDecimal dailyRate = new BigDecimal("10000000")
                    .divide(BigDecimal.valueOf(22), 2, java.math.RoundingMode.HALF_UP);
            assertThat(deduction).isEqualByComparingTo(dailyRate);
        }

        private void stubAbsent(List<LocalDate> absentDates) {
            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            // ✅ absentDays ở vị trí thứ 4
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of(attendance(employeeId, BigDecimal.ZERO, BigDecimal.ZERO,
                            (long) absentDates.size())));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.empty());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(any(), any()))
                    .thenReturn(Optional.of(salaryProfile));
            when(attendanceLogRepository.findAbsentDates(eq(employeeId), any(), any()))
                    .thenReturn(absentDates);
            when(taxConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(taxConfig));
            when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(insuranceConfig));
            when(payslipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. KPI BONUS
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("6. KPI Bonus")
    class KpiBonusTests {

        private PerformanceCycles closedCycle;
        private PerformanceReviews review;

        @BeforeEach
        void setUpKpi() {
            closedCycle = new PerformanceCycles();
            closedCycle.setCycleId(UUID.randomUUID());
            review = new PerformanceReviews();
            review.setKpiScore(90.0);
        }

        @Test
        @DisplayName("Không thưởng KPI khi không có cycle nào")
        void shouldHaveZeroKpiBonus_WhenNoCycle() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTotalAllowances()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Không thưởng KPI khi score < 80")
        void shouldHaveZeroKpiBonus_WhenKpiScoreBelow80() {
            review.setKpiScore(79.9);
            stubKpiMocks(closedCycle, review);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTotalAllowances()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Thưởng 2,000,000 khi score = 80 (boundary)")
        void shouldHaveKpiBonus_WhenKpiScoreExactly80() {
            review.setKpiScore(80.0);
            stubKpiMocks(closedCycle, review);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTotalAllowances()).isEqualByComparingTo("2000000");
        }

        @Test
        @DisplayName("Thưởng 2,000,000 khi score > 80")
        void shouldHaveKpiBonus_WhenKpiScoreAbove80() {
            review.setKpiScore(95.0);
            stubKpiMocks(closedCycle, review);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTotalAllowances()).isEqualByComparingTo("2000000");
        }

        @Test
        @DisplayName("KPI score null → không thưởng")
        void shouldHaveZeroKpiBonus_WhenKpiScoreIsNull() {
            review.setKpiScore(null);
            stubKpiMocks(closedCycle, review);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTotalAllowances()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Thưởng KPI xuất hiện trong details với type = ALLOWANCE")
        void shouldAddKpiBonusDetail_WhenEligible() {
            review.setKpiScore(90.0);
            stubKpiMocks(closedCycle, review);

            List<Payslip> result = payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            assertThat(result.get(0).getDetails()).anyMatch(
                    d -> "Thưởng KPI".equals(d.getItemName()) && d.getType() == PayslipDetailType.ALLOWANCE);
        }

        @Test
        @DisplayName("Dùng CLOSED cycle khi tồn tại (review của CLOSED được dùng)")
        void shouldUseClosedCycle_WhenExists() {
            review.setKpiScore(90.0);
            stubKpiMocks(closedCycle, review);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTotalAllowances()).isEqualByComparingTo("2000000");
        }

        @Test
        @DisplayName("Fallback sang ACTIVE cycle khi không có CLOSED")
        void shouldFallbackToActiveCycle_WhenNoClosedCycle() {
            PerformanceCycles activeCycle = new PerformanceCycles();
            activeCycle.setCycleId(UUID.randomUUID());
            review.setKpiScore(90.0);

            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of(attendance(employeeId, BigDecimal.ZERO, BigDecimal.ZERO, 0L)));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.empty());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.of(activeCycle));
            when(performanceReviewsRepository.findByEmployee_EmployeeIdAndCycle_CycleId(
                    employeeId, activeCycle.getCycleId())).thenReturn(Optional.of(review));
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(any(), any()))
                    .thenReturn(Optional.of(salaryProfile));
            when(attendanceLogRepository.findAbsentDates(any(), any(), any())).thenReturn(List.of());
            when(taxConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(taxConfig));
            when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(insuranceConfig));
            when(payslipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTotalAllowances()).isEqualByComparingTo("2000000");
        }

        /**
         * Stub CLOSED cycle + review.
         * ACTIVE cũng được stub rỗng vì service dùng .orElse() → luôn gọi cả hai.
         */
        private void stubKpiMocks(PerformanceCycles cycle, PerformanceReviews rev) {
            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of(attendance(employeeId, BigDecimal.ZERO, BigDecimal.ZERO, 0L)));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.of(cycle));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty()); // luôn bị gọi do .orElse() bug
            when(performanceReviewsRepository.findByEmployee_EmployeeIdAndCycle_CycleId(
                    employeeId, cycle.getCycleId())).thenReturn(Optional.of(rev));
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(any(), any()))
                    .thenReturn(Optional.of(salaryProfile));
            when(attendanceLogRepository.findAbsentDates(any(), any(), any())).thenReturn(List.of());
            when(taxConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(taxConfig));
            when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(insuranceConfig));
            when(payslipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. TAX & INSURANCE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("7. Tax & Insurance Calculation")
    class TaxInsuranceTests {

        @Test
        @DisplayName("Thuế = grossSalary × 10% = 1,000,000")
        void shouldCalculateTaxCorrectly() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTaxAmount()).isEqualByComparingTo("1000000.00");
        }

        @Test
        @DisplayName("Bảo hiểm = grossSalary × 8% = 800,000")
        void shouldCalculateInsuranceCorrectly() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getInsuranceAmount()).isEqualByComparingTo("800000.00");
        }

        @Test
        @DisplayName("Không tính thuế khi taxCode = null")
        void shouldHaveZeroTax_WhenTaxCodeIsNull() {
            salaryProfile.setTaxCode(null);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Không tính bảo hiểm khi insuranceCode = null")
        void shouldHaveZeroInsurance_WhenInsuranceCodeIsNull() {
            salaryProfile.setInsuranceCode(null);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getInsuranceAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Không tính thuế khi không tìm thấy tax config")
        void shouldHaveZeroTax_WhenTaxConfigNotFound() {
            stubHappyPath(PayrollBatchStatus.DRAFT);
            when(taxConfigRepository.findActiveByCodeAndDate(any(), any())).thenReturn(Optional.empty());

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Không tính bảo hiểm khi không tìm thấy insurance config")
        void shouldHaveZeroInsurance_WhenInsuranceConfigNotFound() {
            stubHappyPath(PayrollBatchStatus.DRAFT);
            when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any())).thenReturn(Optional.empty());

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getInsuranceAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Thuế xuất hiện trong details với type = DEDUCTION")
        void shouldAddTaxDetail_WhenTaxApplied() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            List<Payslip> result = payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            assertThat(result.get(0).getDetails()).anyMatch(
                    d -> d.getItemName().contains("Thuế TNCN") && d.getType() == PayslipDetailType.DEDUCTION);
        }

        @Test
        @DisplayName("Bảo hiểm xuất hiện trong details với type = DEDUCTION")
        void shouldAddInsuranceDetail_WhenInsuranceApplied() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            List<Payslip> result = payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            assertThat(result.get(0).getDetails()).anyMatch(
                    d -> d.getItemName().contains("Bảo hiểm") && d.getType() == PayslipDetailType.DEDUCTION);
        }

        @Test
        @DisplayName("totalDeductions = taxAmount + insuranceAmount")
        void shouldCalculateTotalDeductionsCorrectly() {
            stubHappyPath(PayrollBatchStatus.DRAFT);
            Payslip p = payrollCalculationService.calculateBatch(batchId, List.of(employeeId)).get(0);

            assertThat(p.getTotalDeductions())
                    .isEqualByComparingTo(p.getTaxAmount().add(p.getInsuranceAmount()));
        }

        @Test
        @DisplayName("netSalary = grossSalary - totalDeductions")
        void shouldCalculateNetSalaryCorrectly() {
            stubHappyPath(PayrollBatchStatus.DRAFT);
            Payslip p = payrollCalculationService.calculateBatch(batchId, List.of(employeeId)).get(0);

            assertThat(p.getNetSalary())
                    .isEqualByComparingTo(p.getGrossSalary().subtract(p.getTotalDeductions()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. EMPLOYEE STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("8. Employee Status")
    class EmployeeStatusTests {

        /**
         * BUG 1 trong service:
         *   employee.getEmpStatus().name().equals("RESIGNED")
         *   → getEmpStatus() = null (ProgressStatus chưa set) → NullPointerException
         *   → service catch exception → nhân viên bị SKIP → result rỗng.
         *
         * Khi BUG 1 được fix (đổi thành employee.getStatus() == EmployeeStatus.RESIGNED),
         * test này phải được cập nhật lại:
         *   - RESIGNED → result có 1 payslip, taxAmount = 0, insuranceAmount = 0
         */
        @Test
        @DisplayName("RESIGNED: không tính thuế và bảo hiểm (nghỉ giữa chừng)")
        void resigned_ShouldHaveZeroTaxAndInsurance() {
            // Service: employee.getStatus() == EmployeeStatus.RESIGNED → isResignedMidMonth = true
            // → bỏ qua tính thuế/BH → taxAmount = 0, insuranceAmount = 0
            employee.setStatus(EmployeeStatus.RESIGNED);
            salaryProfile.setEmployee(employee);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            List<Payslip> result = payrollCalculationService.calculateBatch(batchId, List.of(employeeId));

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.get(0).getInsuranceAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("RESIGNED: netSalary = grossSalary (không bị trừ thuế/BH)")
        void resigned_ShouldHaveNetEqualGross() {
            employee.setStatus(EmployeeStatus.RESIGNED);
            salaryProfile.setEmployee(employee);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            Payslip p = payrollCalculationService.calculateBatch(batchId, List.of(employeeId)).get(0);

            assertThat(p.getNetSalary()).isEqualByComparingTo(p.getGrossSalary());
        }

        @Test
        @DisplayName("OFFICIAL: tính thuế và bảo hiểm bình thường")
        void official_ShouldHaveTaxAndInsurance() {
            employee.setStatus(EmployeeStatus.OFFICIAL);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            Payslip p = payrollCalculationService.calculateBatch(batchId, List.of(employeeId)).get(0);

            assertThat(p.getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
            assertThat(p.getInsuranceAmount()).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("PROBATION: tính thuế và bảo hiểm bình thường")
        void probation_ShouldHaveTaxAndInsurance() {
            employee.setStatus(EmployeeStatus.PROBATION);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("INTERN: tính thuế và bảo hiểm bình thường")
        void intern_ShouldHaveTaxAndInsurance() {
            employee.setStatus(EmployeeStatus.INTERN);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("TERMINATED: tính thuế và bảo hiểm bình thường")
        void terminated_ShouldHaveTaxAndInsurance() {
            employee.setStatus(EmployeeStatus.TERMINATED);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("PENDING_OFFBOARD: tính thuế và bảo hiểm bình thường")
        void pendingOffboard_ShouldHaveTaxAndInsurance() {
            employee.setStatus(EmployeeStatus.PENDING_OFFBOARD);
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getTaxAmount()).isGreaterThan(BigDecimal.ZERO);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. GROSS SALARY
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("9. Gross Salary")
    class GrossSalaryTests {

        @Test
        @DisplayName("gross = baseSalary khi không có OT, vắng, KPI")
        void shouldGrossEqualBase_WhenNoOtNoAbsentNoKpi() {
            stubHappyPath(PayrollBatchStatus.DRAFT);

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId))
                    .get(0).getGrossSalary()).isEqualByComparingTo("10000000.00");
        }

        @Test
        @DisplayName("gross = baseSalary + otPay + totalAllowances - absentDeduction")
        void shouldGrossIncludeAllComponents() {
            PerformanceCycles cycle = new PerformanceCycles();
            cycle.setCycleId(UUID.randomUUID());
            PerformanceReviews review = new PerformanceReviews();
            review.setKpiScore(90.0);

            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            // ✅ OT = 4 giờ ở đúng vị trí thứ 3
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of(attendance(employeeId, BigDecimal.ZERO, new BigDecimal("4"), 0L)));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.of(cycle));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(performanceReviewsRepository.findByEmployee_EmployeeIdAndCycle_CycleId(
                    employeeId, cycle.getCycleId())).thenReturn(Optional.of(review));
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(any(), any()))
                    .thenReturn(Optional.of(salaryProfile));
            // 1 ngày vắng thường
            when(attendanceLogRepository.findAbsentDates(any(), any(), any()))
                    .thenReturn(List.of(LocalDate.of(2025, 3, 10)));
            when(taxConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(taxConfig));
            when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(insuranceConfig));
            when(payslipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Payslip p = payrollCalculationService.calculateBatch(batchId, List.of(employeeId)).get(0);

            BigDecimal expected = p.getBaseSalary().add(p.getOtPay())
                    .add(p.getTotalAllowances()).subtract(p.getAbsentDeduction());
            assertThat(p.getGrossSalary()).isEqualByComparingTo(expected);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. MULTI-EMPLOYEE & RESILIENCE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("10. Multi-Employee & Resilience")
    class MultiEmployeeTests {

        @Test
        @DisplayName("Tính lương đúng cho 2 nhân viên trong cùng batch")
        void shouldCalculateMultipleEmployees() {
            UUID emp2 = UUID.randomUUID();
            SalaryProfile profile2 = buildProfile(emp2, "12000000");

            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of(
                            attendance(employeeId, BigDecimal.ZERO, BigDecimal.ZERO, 0L),
                            attendance(emp2,        BigDecimal.ZERO, BigDecimal.ZERO, 0L)));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.empty());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(eq(employeeId), any()))
                    .thenReturn(Optional.of(salaryProfile));
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(eq(emp2), any()))
                    .thenReturn(Optional.of(profile2));
            when(attendanceLogRepository.findAbsentDates(any(), any(), any())).thenReturn(List.of());
            when(taxConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(taxConfig));
            when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(insuranceConfig));
            when(payslipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId, emp2)))
                    .hasSize(2);
        }

        @Test
        @DisplayName("Nhân viên lỗi (không có profile) không ảnh hưởng nhân viên còn lại")
        void shouldContinueProcessing_WhenOneEmployeeFails() {
            UUID emp2 = UUID.randomUUID();
            SalaryProfile profile2 = buildProfile(emp2, "10000000");

            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of(attendance(emp2, BigDecimal.ZERO, BigDecimal.ZERO, 0L)));
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.empty());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty());
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(eq(employeeId), any()))
                    .thenReturn(Optional.empty());           // lỗi → bị skip
            when(salaryProfileRepository.findActiveByEmployeeIdAndDate(eq(emp2), any()))
                    .thenReturn(Optional.of(profile2));     // ok
            when(attendanceLogRepository.findAbsentDates(eq(emp2), any(), any())).thenReturn(List.of());
            when(taxConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(taxConfig));
            when(insuranceConfigRepository.findActiveByCodeAndDate(any(), any()))
                    .thenReturn(Optional.of(insuranceConfig));
            when(payslipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of(employeeId, emp2)))
                    .hasSize(1);
        }

        @Test
        @DisplayName("Không có attendance record → dùng default (0 OT, 0 vắng)")
        void shouldUseDefaultAttendance_WhenNoAttendanceRecord() {
            stubHappyPath(PayrollBatchStatus.DRAFT);
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any()))
                    .thenReturn(List.of()); // rỗng → service tạo DTO default

            Payslip p = payrollCalculationService.calculateBatch(batchId, List.of(employeeId)).get(0);

            assertThat(p.getOtPay()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(p.getAbsentDeduction()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Trả về list rỗng khi không có nhân viên nào")
        void shouldReturnEmpty_WhenNoEmployees() {
            batch.setStatus(PayrollBatchStatus.DRAFT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
            when(attendanceLogRepository.aggregateAttendanceByPeriod(any(), any())).thenReturn(List.of());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.CLOSED))
                    .thenReturn(Optional.empty());
            when(performanceCyclesRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            assertThat(payrollCalculationService.calculateBatch(batchId, List.of())).isEmpty();
        }

        // Helper: tạo SalaryProfile cho nhân viên khác
        private SalaryProfile buildProfile(UUID empId, String salary) {
            Employee e = new Employee();
            e.setEmployeeId(empId);
            e.setStatus(EmployeeStatus.OFFICIAL);
            SalaryProfile p = new SalaryProfile();
            p.setEmployee(e);
            p.setBaseSalary(new BigDecimal(salary));
            p.setTaxCode("TAX01");
            p.setInsuranceCode("INS01");
            return p;
        }
    }
}