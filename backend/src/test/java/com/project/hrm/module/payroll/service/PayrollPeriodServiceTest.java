package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.RequestDTO.CreatePayrollPeriodRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayrollPeriodResponse;
import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.entity.PayrollPeriod;
import com.project.hrm.module.payroll.enums.PayrollBatchStatus;
import com.project.hrm.module.payroll.enums.PayrollPeriodStatus;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.PayrollBatchRepository;
import com.project.hrm.module.payroll.repository.PayrollPeriodRepository;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho PayrollPeriodService.
 *
 * Enum values:
 *   PayrollPeriodStatus : OPEN, CLOSED, PAID
 *   PayrollBatchStatus  : DRAFT, VALIDATED, PROCESSED, LOCKED
 *   PayslipStatus       : DRAFT, CONFIRMED, PAID, CANCELLED
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PayrollPeriodService Tests")
class PayrollPeriodServiceTest {

    @Mock private PayrollPeriodRepository periodRepository;
    @Mock private PayslipRepository       payslipRepository;
    @Mock private PayrollBatchRepository  batchRepository;

    @InjectMocks
    private PayrollPeriodService payrollPeriodService;

    // ─── Common fixtures ───────────────────────────────────────────────────────
    private UUID                       periodId;
    private PayrollPeriod              period;
    private PayrollBatch               batch;
    private CreatePayrollPeriodRequest createReq;

    @BeforeEach
    void setUp() {
        periodId = UUID.randomUUID();

        period = PayrollPeriod.builder()
                .periodId(periodId)
                .month(3)
                .year(2025)
                .startDate(LocalDate.of(2025, 3, 1))
                .endDate(LocalDate.of(2025, 3, 31))
                .status(PayrollPeriodStatus.OPEN)
                .build();

        batch = PayrollBatch.builder()
                .batchId(UUID.randomUUID())
                .period(period)
                .status(PayrollBatchStatus.DRAFT)
                .build();

        createReq = new CreatePayrollPeriodRequest();
        createReq.setMonth(3);
        createReq.setYear(2025);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. createPeriod – Validation
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. createPeriod – Validation")
    class CreatePeriodValidation {

        @Test
        @DisplayName("Throw PayrollException khi tháng/năm đã tồn tại")
        void shouldThrow_WhenMonthYearAlreadyExists() {
            when(periodRepository.existsByMonthAndYear(3, 2025)).thenReturn(true);

            assertThatThrownBy(() -> payrollPeriodService.createPeriod(createReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("3/2025")
                    .hasMessageContaining("đã tồn tại");
        }

        @Test
        @DisplayName("Throw PayrollException khi vẫn còn kỳ đang OPEN")
        void shouldThrow_WhenOpenPeriodExists() {
            when(periodRepository.existsByMonthAndYear(3, 2025)).thenReturn(false);
            when(periodRepository.findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.OPEN))
                    .thenReturn(List.of(period)); // kỳ tháng 3 đang OPEN

            assertThatThrownBy(() -> payrollPeriodService.createPeriod(createReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("hoàn tất");
        }

        @Test
        @DisplayName("Thông báo lỗi chứa tháng/năm của kỳ OPEN hiện tại")
        void shouldIncludeOpenPeriodInfo_InErrorMessage() {
            PayrollPeriod openPeriod = PayrollPeriod.builder()
                    .periodId(UUID.randomUUID()).month(2).year(2025)
                    .status(PayrollPeriodStatus.OPEN).build();
            when(periodRepository.existsByMonthAndYear(3, 2025)).thenReturn(false);
            when(periodRepository.findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.OPEN))
                    .thenReturn(List.of(openPeriod));

            assertThatThrownBy(() -> payrollPeriodService.createPeriod(createReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("2/2025");
        }

        @Test
        @DisplayName("Tạo thành công khi không có kỳ trùng và không có kỳ OPEN")
        void shouldCreateSuccessfully_WhenNoConflict() {
            stubCreateHappyPath();

            assertThatNoException().isThrownBy(() -> payrollPeriodService.createPeriod(createReq));
            verify(periodRepository).save(any(PayrollPeriod.class));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. createPeriod – Period data
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. createPeriod – Period data")
    class CreatePeriodData {

        @Test
        @DisplayName("Period được tạo với status = OPEN")
        void shouldCreatePeriod_WithOpenStatus() {
            stubCreateHappyPath();

            payrollPeriodService.createPeriod(createReq);

            ArgumentCaptor<PayrollPeriod> captor = ArgumentCaptor.forClass(PayrollPeriod.class);
            verify(periodRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(PayrollPeriodStatus.OPEN);
        }

        @Test
        @DisplayName("startDate = ngày đầu tháng")
        void shouldSetStartDate_ToFirstDayOfMonth() {
            stubCreateHappyPath();

            payrollPeriodService.createPeriod(createReq);

            ArgumentCaptor<PayrollPeriod> captor = ArgumentCaptor.forClass(PayrollPeriod.class);
            verify(periodRepository).save(captor.capture());
            assertThat(captor.getValue().getStartDate()).isEqualTo(LocalDate.of(2025, 3, 1));
        }

        @Test
        @DisplayName("endDate = ngày cuối tháng (tháng 3 = 31)")
        void shouldSetEndDate_ToLastDayOfMonth_March() {
            stubCreateHappyPath();

            payrollPeriodService.createPeriod(createReq);

            ArgumentCaptor<PayrollPeriod> captor = ArgumentCaptor.forClass(PayrollPeriod.class);
            verify(periodRepository).save(captor.capture());
            assertThat(captor.getValue().getEndDate()).isEqualTo(LocalDate.of(2025, 3, 31));
        }

        @Test
        @DisplayName("endDate = ngày 28 cho tháng 2 năm thường")
        void shouldSetEndDate_ToFeb28_NonLeapYear() {
            createReq.setMonth(2);
            createReq.setYear(2025); // 2025 không phải năm nhuận
            when(periodRepository.existsByMonthAndYear(2, 2025)).thenReturn(false);
            when(periodRepository.findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.OPEN))
                    .thenReturn(List.of());
            when(periodRepository.save(any())).thenAnswer(inv -> {
                PayrollPeriod p = inv.getArgument(0);
                p.setPeriodId(UUID.randomUUID());
                return p;
            });
            when(batchRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(batchRepository.findByPeriod_PeriodId(any())).thenReturn(Optional.of(batch));

            payrollPeriodService.createPeriod(createReq);

            ArgumentCaptor<PayrollPeriod> captor = ArgumentCaptor.forClass(PayrollPeriod.class);
            verify(periodRepository).save(captor.capture());
            assertThat(captor.getValue().getEndDate()).isEqualTo(LocalDate.of(2025, 2, 28));
        }

        @Test
        @DisplayName("endDate = ngày 29 cho tháng 2 năm nhuận")
        void shouldSetEndDate_ToFeb29_LeapYear() {
            createReq.setMonth(2);
            createReq.setYear(2024); // 2024 là năm nhuận
            when(periodRepository.existsByMonthAndYear(2, 2024)).thenReturn(false);
            when(periodRepository.findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.OPEN))
                    .thenReturn(List.of());
            when(periodRepository.save(any())).thenAnswer(inv -> {
                PayrollPeriod p = inv.getArgument(0);
                p.setPeriodId(UUID.randomUUID());
                return p;
            });
            when(batchRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(batchRepository.findByPeriod_PeriodId(any())).thenReturn(Optional.of(batch));

            payrollPeriodService.createPeriod(createReq);

            ArgumentCaptor<PayrollPeriod> captor = ArgumentCaptor.forClass(PayrollPeriod.class);
            verify(periodRepository).save(captor.capture());
            assertThat(captor.getValue().getEndDate()).isEqualTo(LocalDate.of(2024, 2, 29));
        }

        @Test
        @DisplayName("month và year được lưu đúng vào Period")
        void shouldSaveCorrectMonthAndYear() {
            stubCreateHappyPath();

            payrollPeriodService.createPeriod(createReq);

            ArgumentCaptor<PayrollPeriod> captor = ArgumentCaptor.forClass(PayrollPeriod.class);
            verify(periodRepository).save(captor.capture());
            assertThat(captor.getValue().getMonth()).isEqualTo(3);
            assertThat(captor.getValue().getYear()).isEqualTo(2025);
        }

        @Test
        @DisplayName("Response trả về đúng month, year, status")
        void shouldReturnCorrectResponse() {
            stubCreateHappyPath();

            PayrollPeriodResponse response = payrollPeriodService.createPeriod(createReq);

            assertThat(response.getMonth()).isEqualTo(3);
            assertThat(response.getYear()).isEqualTo(2025);
            assertThat(response.getStatus()).isEqualTo(PayrollPeriodStatus.OPEN);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. createPeriod – Auto Batch
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. createPeriod – Auto Batch")
    class CreatePeriodAutoBatch {

        @Test
        @DisplayName("Tự động tạo batch DRAFT sau khi tạo period")
        void shouldAutoCreateDraftBatch_AfterPeriodCreated() {
            stubCreateHappyPath();

            payrollPeriodService.createPeriod(createReq);

            ArgumentCaptor<PayrollBatch> batchCaptor = ArgumentCaptor.forClass(PayrollBatch.class);
            verify(batchRepository).save(batchCaptor.capture());
            assertThat(batchCaptor.getValue().getStatus()).isEqualTo(PayrollBatchStatus.DRAFT);
        }

        @Test
        @DisplayName("Batch được gắn đúng period")
        void shouldLinkBatch_ToCorrectPeriod() {
            stubCreateHappyPath();

            payrollPeriodService.createPeriod(createReq);

            ArgumentCaptor<PayrollBatch> batchCaptor = ArgumentCaptor.forClass(PayrollBatch.class);
            verify(batchRepository).save(batchCaptor.capture());
            assertThat(batchCaptor.getValue().getPeriod()).isNotNull();
        }

        @Test
        @DisplayName("Response chứa batchId sau khi tạo")
        void shouldReturnBatchId_InResponse() {
            stubCreateHappyPath();

            PayrollPeriodResponse response = payrollPeriodService.createPeriod(createReq);

            assertThat(response.getBatchId()).isEqualTo(batch.getBatchId());
        }

        @Test
        @DisplayName("Response chứa batchStatus = DRAFT")
        void shouldReturnBatchStatus_InResponse() {
            stubCreateHappyPath();

            PayrollPeriodResponse response = payrollPeriodService.createPeriod(createReq);

            assertThat(response.getBatchStatus()).isEqualTo(PayrollBatchStatus.DRAFT);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. closePeriod – Validation
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. closePeriod – Validation")
    class ClosePeriodValidation {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi period không tồn tại")
        void shouldThrow_WhenPeriodNotFound() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> payrollPeriodService.closePeriod(periodId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(periodId.toString());
        }

        @Test
        @DisplayName("Throw PayrollException khi period đã PAID")
        void shouldThrow_WhenPeriodAlreadyPaid() {
            period.setStatus(PayrollPeriodStatus.PAID);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));

            assertThatThrownBy(() -> payrollPeriodService.closePeriod(periodId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("OPEN");
        }

        @Test
        @DisplayName("Throw PayrollException khi period đã CLOSED")
        void shouldThrow_WhenPeriodAlreadyClosed() {
            period.setStatus(PayrollPeriodStatus.CLOSED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));

            assertThatThrownBy(() -> payrollPeriodService.closePeriod(periodId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("OPEN");
        }

        @Test
        @DisplayName("Throw PayrollException khi còn payslip chưa PAID trong kỳ")
        void shouldThrow_WhenUnpaidPayslipsExist() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(payslipRepository.existsByBatch_Period_PeriodIdAndStatusNot(
                    periodId, PayslipStatus.PAID)).thenReturn(true);

            assertThatThrownBy(() -> payrollPeriodService.closePeriod(periodId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("chưa thanh toán");
        }

        @Test
        @DisplayName("Đóng thành công khi period OPEN và tất cả payslip đã PAID")
        void shouldCloseSuccessfully_WhenAllPayslipsPaid() {
            stubCloseHappyPath();

            assertThatNoException().isThrownBy(() -> payrollPeriodService.closePeriod(periodId));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. closePeriod – Behavior
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("5. closePeriod – Behavior")
    class ClosePeriodBehavior {

        @Test
        @DisplayName("Period status → PAID sau khi đóng thành công")
        void shouldUpdatePeriodStatus_ToPaid() {
            stubCloseHappyPath();

            payrollPeriodService.closePeriod(periodId);

            assertThat(period.getStatus()).isEqualTo(PayrollPeriodStatus.PAID);
        }

        @Test
        @DisplayName("periodRepository.save được gọi với period đã cập nhật")
        void shouldSavePeriod_AfterClose() {
            stubCloseHappyPath();

            payrollPeriodService.closePeriod(periodId);

            verify(periodRepository).save(period);
        }

        @Test
        @DisplayName("Response trả về status = PAID sau khi đóng")
        void shouldReturnPaidStatus_InResponse() {
            stubCloseHappyPath();

            PayrollPeriodResponse response = payrollPeriodService.closePeriod(periodId);

            assertThat(response.getStatus()).isEqualTo(PayrollPeriodStatus.PAID);
        }

        @Test
        @DisplayName("Response trả về đúng periodId")
        void shouldReturnCorrectPeriodId_InResponse() {
            stubCloseHappyPath();

            PayrollPeriodResponse response = payrollPeriodService.closePeriod(periodId);

            assertThat(response.getPeriodId()).isEqualTo(periodId);
        }

        @Test
        @DisplayName("existsByBatch_Period_PeriodIdAndStatusNot được gọi với PayslipStatus.PAID")
        void shouldCheckUnpaidPayslips_WithCorrectStatus() {
            stubCloseHappyPath();

            payrollPeriodService.closePeriod(periodId);

            verify(payslipRepository)
                    .existsByBatch_Period_PeriodIdAndStatusNot(periodId, PayslipStatus.PAID);
        }

        @Test
        @DisplayName("Response chứa batchId và batchStatus")
        void shouldReturnBatchInfo_InCloseResponse() {
            stubCloseHappyPath();

            PayrollPeriodResponse response = payrollPeriodService.closePeriod(periodId);

            assertThat(response.getBatchId()).isEqualTo(batch.getBatchId());
            assertThat(response.getBatchStatus()).isEqualTo(PayrollBatchStatus.DRAFT);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. getAllPeriods
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("6. getAllPeriods")
    class GetAllPeriods {

        @Test
        @DisplayName("Trả về list đầy đủ tất cả periods")
        void shouldReturnAllPeriods() {
            PayrollPeriod period2 = PayrollPeriod.builder()
                    .periodId(UUID.randomUUID()).month(2).year(2025)
                    .status(PayrollPeriodStatus.PAID).build();
            when(periodRepository.findAll()).thenReturn(List.of(period, period2));
            when(batchRepository.findByPeriod_PeriodId(any())).thenReturn(Optional.of(batch));

            List<PayrollPeriodResponse> result = payrollPeriodService.getAllPeriods();

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Trả về list rỗng khi không có period nào")
        void shouldReturnEmptyList_WhenNoPeriods() {
            when(periodRepository.findAll()).thenReturn(List.of());

            assertThat(payrollPeriodService.getAllPeriods()).isEmpty();
        }

        @Test
        @DisplayName("Gọi periodRepository.findAll()")
        void shouldCallFindAll() {
            when(periodRepository.findAll()).thenReturn(List.of());

            payrollPeriodService.getAllPeriods();

            verify(periodRepository).findAll();
        }

        @Test
        @DisplayName("Response chứa đúng status của từng period")
        void shouldMapStatus_Correctly() {
            PayrollPeriod paidPeriod = PayrollPeriod.builder()
                    .periodId(UUID.randomUUID()).month(1).year(2025)
                    .status(PayrollPeriodStatus.PAID).build();
            PayrollPeriod openPeriod = PayrollPeriod.builder()
                    .periodId(UUID.randomUUID()).month(2).year(2025)
                    .status(PayrollPeriodStatus.OPEN).build();
            when(periodRepository.findAll()).thenReturn(List.of(paidPeriod, openPeriod));
            when(batchRepository.findByPeriod_PeriodId(any())).thenReturn(Optional.of(batch));

            List<PayrollPeriodResponse> result = payrollPeriodService.getAllPeriods();

            assertThat(result).extracting(PayrollPeriodResponse::getStatus)
                    .containsExactly(PayrollPeriodStatus.PAID, PayrollPeriodStatus.OPEN);
        }

        @Test
        @DisplayName("Response không có batchId khi không tìm thấy batch")
        void shouldReturnNullBatchId_WhenNoBatchFound() {
            when(periodRepository.findAll()).thenReturn(List.of(period));
            when(batchRepository.findByPeriod_PeriodId(any())).thenReturn(Optional.empty());

            List<PayrollPeriodResponse> result = payrollPeriodService.getAllPeriods();

            assertThat(result.get(0).getBatchId()).isNull();
            assertThat(result.get(0).getBatchStatus()).isNull();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. getPeriod
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("7. getPeriod")
    class GetPeriod {

        @Test
        @DisplayName("Trả về đúng period khi tìm thấy")
        void shouldReturnPeriod_WhenFound() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(batchRepository.findByPeriod_PeriodId(periodId)).thenReturn(Optional.of(batch));

            PayrollPeriodResponse response = payrollPeriodService.getPeriod(periodId);

            assertThat(response.getPeriodId()).isEqualTo(periodId);
            assertThat(response.getMonth()).isEqualTo(3);
            assertThat(response.getYear()).isEqualTo(2025);
        }

        @Test
        @DisplayName("Throw ResourceNotFoundException khi period không tồn tại")
        void shouldThrow_WhenPeriodNotFound() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> payrollPeriodService.getPeriod(periodId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(periodId.toString());
        }

        @Test
        @DisplayName("Response chứa startDate và endDate đúng")
        void shouldReturnCorrectDates() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(batchRepository.findByPeriod_PeriodId(periodId)).thenReturn(Optional.of(batch));

            PayrollPeriodResponse response = payrollPeriodService.getPeriod(periodId);

            assertThat(response.getStartDate()).isEqualTo(LocalDate.of(2025, 3, 1));
            assertThat(response.getEndDate()).isEqualTo(LocalDate.of(2025, 3, 31));
        }

        @Test
        @DisplayName("Response chứa batchId và batchStatus khi có batch")
        void shouldReturnBatchInfo_WhenBatchExists() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(batchRepository.findByPeriod_PeriodId(periodId)).thenReturn(Optional.of(batch));

            PayrollPeriodResponse response = payrollPeriodService.getPeriod(periodId);

            assertThat(response.getBatchId()).isEqualTo(batch.getBatchId());
            assertThat(response.getBatchStatus()).isEqualTo(PayrollBatchStatus.DRAFT);
        }

        @Test
        @DisplayName("Response batchId = null khi không có batch")
        void shouldReturnNullBatchId_WhenNoBatch() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(batchRepository.findByPeriod_PeriodId(periodId)).thenReturn(Optional.empty());

            PayrollPeriodResponse response = payrollPeriodService.getPeriod(periodId);

            assertThat(response.getBatchId()).isNull();
            assertThat(response.getBatchStatus()).isNull();
        }

        @Test
        @DisplayName("Response chứa đúng status của period")
        void shouldReturnCorrectStatus() {
            period.setStatus(PayrollPeriodStatus.PAID);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));
            when(batchRepository.findByPeriod_PeriodId(periodId)).thenReturn(Optional.of(batch));

            PayrollPeriodResponse response = payrollPeriodService.getPeriod(periodId);

            assertThat(response.getStatus()).isEqualTo(PayrollPeriodStatus.PAID);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /** Stub happy-path cho createPeriod (tháng 3/2025). */
    private void stubCreateHappyPath() {
        when(periodRepository.existsByMonthAndYear(3, 2025)).thenReturn(false);
        when(periodRepository.findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.OPEN))
                .thenReturn(List.of());
        when(periodRepository.save(any())).thenAnswer(inv -> {
            PayrollPeriod p = inv.getArgument(0);
            p.setPeriodId(periodId);
            return p;
        });
        when(batchRepository.save(any())).thenAnswer(inv -> {
            PayrollBatch b = inv.getArgument(0);
            b.setBatchId(batch.getBatchId());
            return b;
        });
        when(batchRepository.findByPeriod_PeriodId(periodId)).thenReturn(Optional.of(batch));
    }

    /** Stub happy-path cho closePeriod: period OPEN, không có payslip chưa PAID. */
    private void stubCloseHappyPath() {
        when(periodRepository.findById(periodId)).thenReturn(Optional.of(period));
        when(payslipRepository.existsByBatch_Period_PeriodIdAndStatusNot(
                periodId, PayslipStatus.PAID)).thenReturn(false);
        when(periodRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(batchRepository.findByPeriod_PeriodId(periodId)).thenReturn(Optional.of(batch));
    }
}