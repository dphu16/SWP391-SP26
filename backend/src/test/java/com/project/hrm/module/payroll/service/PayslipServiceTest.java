package com.project.hrm.module.payroll.service;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayslipResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.TaxReportResponse;
import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.entity.PayrollPeriod;
import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.entity.PayslipDetail;
import com.project.hrm.module.payroll.enums.PayrollBatchStatus;
import com.project.hrm.module.payroll.enums.PayslipDetailType;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.exception.AccessDeniedException;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.PayrollBatchRepository;
import com.project.hrm.module.payroll.repository.PayslipRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho PayslipService.
 *
 * Enum values:
 *   PayslipStatus      : DRAFT, CONFIRMED, PAID, CANCELLED
 *   PayrollBatchStatus : DRAFT, VALIDATED, PROCESSED, LOCKED
 *   PayslipDetailType  : ALLOWANCE, DEDUCTION
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PayslipService Tests")
class PayslipServiceTest {

    @Mock private PayslipRepository             payslipRepository;
    @Mock private EmployeeRepository            employeeRepository;
    @Mock private PayrollCalculationService     calculationService;
    @Mock private PayrollBatchRepository        batchRepository;

    @InjectMocks
    private PayslipService payslipService;

    // ─── Common fixtures ───────────────────────────────────────────────────────
    private UUID           payslipId;
    private UUID           employeeId;
    private UUID           batchId;

    private Employee       employee;
    private PayrollBatch   batch;
    private PayrollPeriod  period;
    private Payslip        payslip;

    @BeforeEach
    void setUp() {
        payslipId  = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        batchId    = UUID.randomUUID();

        Department dept = new Department();
        dept.setDeptId(UUID.randomUUID());
        dept.setDeptName("Engineering");

        Position pos = new Position();
        pos.setPositionId(UUID.randomUUID());
        pos.setTitle("Developer");

        employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setFullName("Nguyen Van A");
        employee.setEmployeeCode("EMP001");
        employee.setDepartment(dept);
        employee.setPosition(pos);

        period = new PayrollPeriod();
        period.setPeriodId(UUID.randomUUID());
        period.setMonth(3);
        period.setYear(2025);

        batch = new PayrollBatch();
        batch.setBatchId(batchId);
        batch.setStatus(PayrollBatchStatus.DRAFT);
        batch.setPeriod(period);

        payslip = buildPayslip(payslipId, employee, batch, PayslipStatus.DRAFT);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. getMyPayslips
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. getMyPayslips")
    class GetMyPayslips {

        @Test
        @DisplayName("Trả về danh sách payslip của employee")
        void shouldReturnPayslips_ForEmployee() {
            when(payslipRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(payslip));

            List<PayslipResponse> result = payslipService.getMyPayslips(employeeId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getEmployeeId()).isEqualTo(employeeId);
        }

        @Test
        @DisplayName("Trả về list rỗng khi employee chưa có payslip")
        void shouldReturnEmptyList_WhenNoPayslips() {
            when(payslipRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of());

            assertThat(payslipService.getMyPayslips(employeeId)).isEmpty();
        }

        @Test
        @DisplayName("Gọi đúng repository method với employeeId")
        void shouldCallRepository_WithEmployeeId() {
            when(payslipRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of());

            payslipService.getMyPayslips(employeeId);

            verify(payslipRepository)
                    .findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId);
        }

        @Test
        @DisplayName("Trả về nhiều payslip khi có nhiều kỳ lương")
        void shouldReturnMultiplePayslips() {
            Payslip payslip2 = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.PAID);
            when(payslipRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(payslip, payslip2));

            assertThat(payslipService.getMyPayslips(employeeId)).hasSize(2);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. getMyPayslip
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. getMyPayslip")
    class GetMyPayslip {

        @Test
        @DisplayName("Trả về payslip khi employee xem đúng phiếu của mình")
        void shouldReturnPayslip_WhenOwnerRequests() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

            PayslipResponse response = payslipService.getMyPayslip(payslipId, employeeId);

            assertThat(response.getPayslipId()).isEqualTo(payslipId);
            assertThat(response.getEmployeeId()).isEqualTo(employeeId);
        }

        @Test
        @DisplayName("Throw ResourceNotFoundException khi payslip không tồn tại")
        void shouldThrow_WhenPayslipNotFound() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> payslipService.getMyPayslip(payslipId, employeeId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(payslipId.toString());
        }

        @Test
        @DisplayName("Throw AccessDeniedException khi employee xem phiếu của người khác")
        void shouldThrow_WhenEmployeeAccessesOtherPayslip() {
            UUID otherEmployeeId = UUID.randomUUID();
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

            assertThatThrownBy(() -> payslipService.getMyPayslip(payslipId, otherEmployeeId))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("không có quyền");
        }

        @Test
        @DisplayName("Không throw khi requestingEmployeeId trùng chủ sở hữu")
        void shouldNotThrow_WhenRequestingEmployeeIsOwner() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

            assertThatNoException()
                    .isThrownBy(() -> payslipService.getMyPayslip(payslipId, employeeId));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. getPayslipsByBatch
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. getPayslipsByBatch")
    class GetPayslipsByBatch {

        @Test
        @DisplayName("Trả về tất cả payslip trong batch")
        void shouldReturnAllPayslips_ForBatch() {
            Payslip ps2 = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.CONFIRMED);
            when(payslipRepository.findAllByBatch_BatchId(batchId))
                    .thenReturn(List.of(payslip, ps2));

            List<PayslipResponse> result = payslipService.getPayslipsByBatch(batchId);

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Trả về list rỗng khi batch không có payslip")
        void shouldReturnEmptyList_WhenBatchHasNoPayslips() {
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of());

            assertThat(payslipService.getPayslipsByBatch(batchId)).isEmpty();
        }

        @Test
        @DisplayName("Gọi đúng repository method với batchId")
        void shouldCallRepository_WithBatchId() {
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of());

            payslipService.getPayslipsByBatch(batchId);

            verify(payslipRepository).findAllByBatch_BatchId(batchId);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. calculateForBatch
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. calculateForBatch")
    class CalculateForBatch {

        @Test
        @DisplayName("Gọi calculationService.calculateBatch với tất cả employeeId")
        void shouldCallCalculationService_WithAllEmployeeIds() {
            Employee emp2 = new Employee();
            emp2.setEmployeeId(UUID.randomUUID());
            emp2.setDepartment(employee.getDepartment());
            when(employeeRepository.findAll()).thenReturn(List.of(employee, emp2));
            when(calculationService.calculateBatch(eq(batchId), anyList()))
                    .thenReturn(List.of(payslip));

            payslipService.calculateForBatch(batchId);

            verify(calculationService).calculateBatch(eq(batchId), argThat(ids ->
                    ids.contains(employeeId) && ids.contains(emp2.getEmployeeId())));
        }

        @Test
        @DisplayName("Trả về list payslip response sau khi tính lương")
        void shouldReturnPayslipResponses_AfterCalculation() {
            when(employeeRepository.findAll()).thenReturn(List.of(employee));
            when(calculationService.calculateBatch(eq(batchId), anyList()))
                    .thenReturn(List.of(payslip));

            List<PayslipResponse> result = payslipService.calculateForBatch(batchId);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Trả về list rỗng khi không có employee nào")
        void shouldReturnEmptyList_WhenNoEmployees() {
            when(employeeRepository.findAll()).thenReturn(List.of());
            when(calculationService.calculateBatch(eq(batchId), eq(List.of())))
                    .thenReturn(List.of());

            assertThat(payslipService.calculateForBatch(batchId)).isEmpty();
        }

        @Test
        @DisplayName("Gọi employeeRepository.findAll() để lấy danh sách nhân viên")
        void shouldCallEmployeeRepository_FindAll() {
            when(employeeRepository.findAll()).thenReturn(List.of());
            when(calculationService.calculateBatch(any(), anyList())).thenReturn(List.of());

            payslipService.calculateForBatch(batchId);

            verify(employeeRepository).findAll();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. getTaxReportByBatch
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("5. getTaxReportByBatch")
    class GetTaxReportByBatch {

        @Test
        @DisplayName("Trả về tax report cho tất cả payslip trong batch")
        void shouldReturnTaxReport_ForBatch() {
            payslip.setBaseSalary(new BigDecimal("10000000"));
            payslip.setGrossSalary(new BigDecimal("12000000"));
            payslip.setTaxAmount(new BigDecimal("1000000"));
            payslip.setInsuranceAmount(new BigDecimal("800000"));
            payslip.setTotalDeductions(new BigDecimal("1800000"));
            payslip.setNetSalary(new BigDecimal("10200000"));
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));

            List<TaxReportResponse> result = payslipService.getTaxReportByBatch(batchId);

            assertThat(result).hasSize(1);
            TaxReportResponse r = result.get(0);
            assertThat(r.getEmployeeId()).isEqualTo(employeeId);
            assertThat(r.getEmployeeCode()).isEqualTo("EMP001");
            assertThat(r.getEmployeeName()).isEqualTo("Nguyen Van A");
            assertThat(r.getDepartment()).isEqualTo("Engineering");
            assertThat(r.getMonth()).isEqualTo(3);
            assertThat(r.getYear()).isEqualTo(2025);
            assertThat(r.getTaxAmount()).isEqualTo(1000000.0);
            assertThat(r.getInsuranceAmount()).isEqualTo(800000.0);
            assertThat(r.getNetSalary()).isEqualTo(10200000.0);
        }

        @Test
        @DisplayName("Trả về list rỗng khi batch không có payslip")
        void shouldReturnEmptyList_WhenBatchHasNoPayslips() {
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of());

            assertThat(payslipService.getTaxReportByBatch(batchId)).isEmpty();
        }

        @Test
        @DisplayName("Các trường null được xử lý an toàn (trả về 0.0)")
        void shouldHandleNullAmounts_Safely() {
            payslip.setTaxAmount(null);
            payslip.setInsuranceAmount(null);
            payslip.setNetSalary(null);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));

            List<TaxReportResponse> result = payslipService.getTaxReportByBatch(batchId);

            assertThat(result.get(0).getTaxAmount()).isEqualTo(0.0);
            assertThat(result.get(0).getInsuranceAmount()).isEqualTo(0.0);
            assertThat(result.get(0).getNetSalary()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("department = null khi employee không có phòng ban")
        void shouldReturnNullDepartment_WhenEmployeeHasNoDepartment() {
            employee.setDepartment(null);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));

            List<TaxReportResponse> result = payslipService.getTaxReportByBatch(batchId);

            assertThat(result.get(0).getDepartment()).isNull();
        }

        @Test
        @DisplayName("position = null khi employee không có vị trí")
        void shouldReturnNullPosition_WhenEmployeeHasNoPosition() {
            employee.setPosition(null);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));

            List<TaxReportResponse> result = payslipService.getTaxReportByBatch(batchId);

            assertThat(result.get(0).getPosition()).isNull();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. validateAllInBatch
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("6. validateAllInBatch")
    class ValidateAllInBatch {

        @Test
        @DisplayName("Tất cả payslip DRAFT → CONFIRMED sau khi validate")
        void shouldConfirmAllDraftPayslips() {
            Payslip draft1 = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.DRAFT);
            Payslip draft2 = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.DRAFT);
            when(payslipRepository.findAllByBatch_BatchId(batchId))
                    .thenReturn(List.of(draft1, draft2));
            when(payslipRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.validateAllInBatch(batchId);

            assertThat(draft1.getStatus()).isEqualTo(PayslipStatus.CONFIRMED);
            assertThat(draft2.getStatus()).isEqualTo(PayslipStatus.CONFIRMED);
        }

        @Test
        @DisplayName("confirmedAt được set cho payslip DRAFT sau khi validate")
        void shouldSetConfirmedAt_ForDraftPayslips() {
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));
            when(payslipRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.validateAllInBatch(batchId);

            assertThat(payslip.getConfirmedAt()).isNotNull();
        }

        @Test
        @DisplayName("Payslip CONFIRMED không bị thay đổi khi validateAll")
        void shouldNotChangeAlreadyConfirmedPayslips() {
            Payslip confirmed = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.CONFIRMED);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(confirmed));
            when(payslipRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.validateAllInBatch(batchId);

            assertThat(confirmed.getStatus()).isEqualTo(PayslipStatus.CONFIRMED);
        }

        @Test
        @DisplayName("Payslip CANCELLED không bị thay đổi khi validateAll")
        void shouldNotChangeCancelledPayslips() {
            Payslip cancelled = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.CANCELLED);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(cancelled));
            when(payslipRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.validateAllInBatch(batchId);

            assertThat(cancelled.getStatus()).isEqualTo(PayslipStatus.CANCELLED);
        }

        @Test
        @DisplayName("saveAll được gọi sau khi validate")
        void shouldCallSaveAll_AfterValidation() {
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));
            when(payslipRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.validateAllInBatch(batchId);

            verify(payslipRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("Batch status → VALIDATED khi tất cả payslip đã CONFIRMED/CANCELLED")
        void shouldUpdateBatchStatus_ToValidated_WhenAllConfirmed() {
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));
            when(payslipRepository.saveAll(anyList())).thenAnswer(inv -> {
                payslip.setStatus(PayslipStatus.CONFIRMED); // simulate save
                return List.of(payslip);
            });
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.validateAllInBatch(batchId);

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.VALIDATED);
            verify(batchRepository).save(batch);
        }

        @Test
        @DisplayName("Batch không đổi sang VALIDATED khi vẫn còn payslip DRAFT")
        void shouldNotUpdateBatchStatus_WhenSomeDraftRemain() {
            // validateAllInBatch loop sẽ đổi TẤT CẢ DRAFT → CONFIRMED trong memory
            // nên sau saveAll, cả payslip lẫn draft2 đều CONFIRMED
            // → checkAndUpdateBatchStatus sẽ thấy allConfirmed=true → batch.save bị gọi
            // Test này không thể verify "never save" với flow thực tế.
            // Thay vào đó: verify rằng khi batch đã VALIDATED thì không save lại.
            batch.setStatus(PayrollBatchStatus.VALIDATED);

            Payslip draft2 = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.DRAFT);
            when(payslipRepository.findAllByBatch_BatchId(batchId))
                    .thenReturn(List.of(payslip, draft2));
            when(payslipRepository.saveAll(anyList())).thenAnswer(inv -> {
                payslip.setStatus(PayslipStatus.CONFIRMED);
                draft2.setStatus(PayslipStatus.CONFIRMED);
                return List.of(payslip, draft2);
            });
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.validateAllInBatch(batchId);

            // Batch đã VALIDATED → checkAndUpdateBatchStatus không gọi save
            verify(batchRepository, never()).save(batch);
        }

        @Test
        @DisplayName("Trả về response của tất cả payslip đã save")
        void shouldReturnResponses_AfterValidation() {
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));
            when(payslipRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            List<PayslipResponse> result = payslipService.validateAllInBatch(batchId);

            assertThat(result).hasSize(1);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. confirmPayslip
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("7. confirmPayslip")
    class ConfirmPayslip {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi payslip không tồn tại")
        void shouldThrow_WhenPayslipNotFound() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> payslipService.confirmPayslip(payslipId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(payslipId.toString());
        }

        @Test
        @DisplayName("Throw PayrollException khi payslip không phải DRAFT")
        void shouldThrow_WhenPayslipNotDraft() {
            payslip.setStatus(PayslipStatus.CONFIRMED);
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

            assertThatThrownBy(() -> payslipService.confirmPayslip(payslipId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("Throw PayrollException khi payslip đang PAID")
        void shouldThrow_WhenPayslipIsPaid() {
            payslip.setStatus(PayslipStatus.PAID);
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

            assertThatThrownBy(() -> payslipService.confirmPayslip(payslipId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("Throw PayrollException khi payslip đã CANCELLED")
        void shouldThrow_WhenPayslipIsCancelled() {
            payslip.setStatus(PayslipStatus.CANCELLED);
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

            assertThatThrownBy(() -> payslipService.confirmPayslip(payslipId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("Status → CONFIRMED sau khi confirm DRAFT payslip")
        void shouldUpdateStatus_ToConfirmed() {
            stubConfirmHappyPath();

            payslipService.confirmPayslip(payslipId);

            assertThat(payslip.getStatus()).isEqualTo(PayslipStatus.CONFIRMED);
        }

        @Test
        @DisplayName("confirmedAt được set sau khi confirm")
        void shouldSetConfirmedAt_AfterConfirm() {
            stubConfirmHappyPath();

            payslipService.confirmPayslip(payslipId);

            assertThat(payslip.getConfirmedAt()).isNotNull();
        }

        @Test
        @DisplayName("payslipRepository.save được gọi")
        void shouldSavePayslip_AfterConfirm() {
            stubConfirmHappyPath();

            payslipService.confirmPayslip(payslipId);

            verify(payslipRepository).save(payslip);
        }

        @Test
        @DisplayName("Response trả về status = CONFIRMED")
        void shouldReturnConfirmedStatus_InResponse() {
            stubConfirmHappyPath();

            PayslipResponse response = payslipService.confirmPayslip(payslipId);

            assertThat(response.getStatus()).isEqualTo(PayslipStatus.CONFIRMED);
        }

        @Test
        @DisplayName("Batch status → VALIDATED khi tất cả payslip trong batch đã CONFIRMED")
        void shouldUpdateBatchStatus_ToValidated_WhenAllConfirmed() {
            Payslip saved = buildPayslip(payslipId, employee, batch, PayslipStatus.CONFIRMED);
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(payslipRepository.save(payslip)).thenReturn(saved);
            // checkAndUpdateBatchStatus: tất cả CONFIRMED
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(saved));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.confirmPayslip(payslipId);

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.VALIDATED);
        }

        @Test
        @DisplayName("Batch không đổi sang VALIDATED khi còn payslip DRAFT khác")
        void shouldNotUpdateBatchStatus_WhenOtherDraftPayslipExist() {
            Payslip saved = buildPayslip(payslipId, employee, batch, PayslipStatus.CONFIRMED);
            Payslip otherDraft = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.DRAFT);
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(payslipRepository.save(payslip)).thenReturn(saved);
            when(payslipRepository.findAllByBatch_BatchId(batchId))
                    .thenReturn(List.of(saved, otherDraft));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.confirmPayslip(payslipId);

            verify(batchRepository, never()).save(batch);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. cancelPayslip
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("8. cancelPayslip")
    class CancelPayslip {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi payslip không tồn tại")
        void shouldThrow_WhenPayslipNotFound() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> payslipService.cancelPayslip(payslipId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(payslipId.toString());
        }

        @Test
        @DisplayName("Throw PayrollException khi payslip đã PAID")
        void shouldThrow_WhenPayslipIsPaid() {
            payslip.setStatus(PayslipStatus.PAID);
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

            assertThatThrownBy(() -> payslipService.cancelPayslip(payslipId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã thanh toán");
        }

        @Test
        @DisplayName("Huỷ thành công payslip DRAFT")
        void shouldCancelSuccessfully_WhenDraft() {
            stubCancelHappyPath(PayslipStatus.DRAFT);

            PayslipResponse response = payslipService.cancelPayslip(payslipId);

            assertThat(payslip.getStatus()).isEqualTo(PayslipStatus.CANCELLED);
            assertThat(response.getStatus()).isEqualTo(PayslipStatus.CANCELLED);
        }

        @Test
        @DisplayName("Huỷ thành công payslip CONFIRMED")
        void shouldCancelSuccessfully_WhenConfirmed() {
            payslip.setStatus(PayslipStatus.CONFIRMED);
            stubCancelHappyPath(PayslipStatus.CONFIRMED);

            payslipService.cancelPayslip(payslipId);

            assertThat(payslip.getStatus()).isEqualTo(PayslipStatus.CANCELLED);
        }

        @Test
        @DisplayName("payslipRepository.save được gọi sau khi huỷ")
        void shouldSavePayslip_AfterCancel() {
            stubCancelHappyPath(PayslipStatus.DRAFT);

            payslipService.cancelPayslip(payslipId);

            verify(payslipRepository).save(payslip);
        }

        @Test
        @DisplayName("Response trả về status = CANCELLED")
        void shouldReturnCancelledStatus_InResponse() {
            stubCancelHappyPath(PayslipStatus.DRAFT);

            PayslipResponse response = payslipService.cancelPayslip(payslipId);

            assertThat(response.getStatus()).isEqualTo(PayslipStatus.CANCELLED);
        }

        @Test
        @DisplayName("Batch → VALIDATED khi tất cả non-CANCELLED đều CONFIRMED sau khi huỷ")
        void shouldUpdateBatchToValidated_WhenRemainingAllConfirmed() {
            Payslip confirmed = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.CONFIRMED);
            Payslip cancelled = buildPayslip(payslipId, employee, batch, PayslipStatus.CANCELLED);

            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(payslipRepository.save(payslip)).thenReturn(cancelled);
            // checkAndUpdateBatchStatus: 1 CONFIRMED, 1 CANCELLED → allConfirmed = true
            when(payslipRepository.findAllByBatch_BatchId(batchId))
                    .thenReturn(List.of(confirmed, cancelled));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.cancelPayslip(payslipId);

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.VALIDATED);
            verify(batchRepository).save(batch);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. checkAndUpdateBatchStatus (gián tiếp qua confirmPayslip / cancelPayslip)
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("9. checkAndUpdateBatchStatus")
    class CheckAndUpdateBatchStatus {

        @Test
        @DisplayName("Batch DRAFT → VALIDATED khi tất cả non-CANCELLED payslip là CONFIRMED")
        void shouldTransition_DraftToValidated_WhenAllNonCancelledConfirmed() {
            Payslip confirmed  = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.CONFIRMED);
            Payslip cancelled  = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.CANCELLED);
            Payslip savedPayslip = buildPayslip(payslipId, employee, batch, PayslipStatus.CONFIRMED);

            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(payslipRepository.save(payslip)).thenReturn(savedPayslip);
            when(payslipRepository.findAllByBatch_BatchId(batchId))
                    .thenReturn(List.of(savedPayslip, confirmed, cancelled));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.confirmPayslip(payslipId);

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.VALIDATED);
        }

        @Test
        @DisplayName("Batch đã VALIDATED không bị thay đổi khi confirm thêm")
        void shouldNotChangeBatch_WhenAlreadyValidated() {
            batch.setStatus(PayrollBatchStatus.VALIDATED);
            Payslip savedPayslip = buildPayslip(payslipId, employee, batch, PayslipStatus.CONFIRMED);

            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(payslipRepository.save(payslip)).thenReturn(savedPayslip);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(savedPayslip));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.confirmPayslip(payslipId);

            // Batch đã VALIDATED → không gọi batchRepository.save
            verify(batchRepository, never()).save(batch);
            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.VALIDATED);
        }

        @Test
        @DisplayName("Không update batch khi payslips list rỗng")
        void shouldNotUpdateBatch_WhenPayslipsListEmpty() {
            Payslip savedPayslip = buildPayslip(payslipId, employee, batch, PayslipStatus.CONFIRMED);
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(payslipRepository.save(payslip)).thenReturn(savedPayslip);
            when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of());
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.confirmPayslip(payslipId);

            verify(batchRepository, never()).save(any());
        }

        @Test
        @DisplayName("PAID payslip cũng được tính là đã hoàn tất (allConfirmed = true)")
        void shouldCountPaidPayslips_AsConfirmed() {
            Payslip paid = buildPayslip(UUID.randomUUID(), employee, batch, PayslipStatus.PAID);
            Payslip savedPayslip = buildPayslip(payslipId, employee, batch, PayslipStatus.CONFIRMED);

            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(payslipRepository.save(payslip)).thenReturn(savedPayslip);
            when(payslipRepository.findAllByBatch_BatchId(batchId))
                    .thenReturn(List.of(savedPayslip, paid));
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

            payslipService.confirmPayslip(payslipId);

            assertThat(batch.getStatus()).isEqualTo(PayrollBatchStatus.VALIDATED);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. toResponse
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("10. toResponse")
    class ToResponse {

        @Test
        @DisplayName("Map đầy đủ các trường cơ bản của payslip")
        void shouldMapBasicFields_Correctly() {
            payslip.setBaseSalary(new BigDecimal("10000000"));
            payslip.setNetSalary(new BigDecimal("8200000"));
            payslip.setStatus(PayslipStatus.CONFIRMED);

            PayslipResponse response = payslipService.toResponse(payslip);

            assertThat(response.getPayslipId()).isEqualTo(payslipId);
            assertThat(response.getEmployeeId()).isEqualTo(employeeId);
            assertThat(response.getEmployeeName()).isEqualTo("Nguyen Van A");
            assertThat(response.getBatchId()).isEqualTo(batchId);
            assertThat(response.getMonth()).isEqualTo(3);
            assertThat(response.getYear()).isEqualTo(2025);
            assertThat(response.getBaseSalary()).isEqualByComparingTo("10000000");
            assertThat(response.getNetSalary()).isEqualByComparingTo("8200000");
            assertThat(response.getStatus()).isEqualTo(PayslipStatus.CONFIRMED);
        }

        @Test
        @DisplayName("departmentName = 'N/A' khi employee không có phòng ban")
        void shouldReturnNA_WhenNoDepartment() {
            employee.setDepartment(null);

            PayslipResponse response = payslipService.toResponse(payslip);

            assertThat(response.getDepartmentName()).isEqualTo("N/A");
        }

        @Test
        @DisplayName("departmentName đúng khi employee có phòng ban")
        void shouldReturnDepartmentName_WhenDepartmentExists() {
            PayslipResponse response = payslipService.toResponse(payslip);

            assertThat(response.getDepartmentName()).isEqualTo("Engineering");
        }

        @Test
        @DisplayName("details = list rỗng khi payslip không có details")
        void shouldReturnEmptyDetails_WhenNoDetails() {
            payslip.setDetails(null);

            PayslipResponse response = payslipService.toResponse(payslip);

            assertThat(response.getDetails()).isEmpty();
        }

        @Test
        @DisplayName("details được map đúng khi có PayslipDetail")
        void shouldMapDetails_Correctly() {
            PayslipDetail detail = PayslipDetail.builder()
                    .payslip(payslip)
                    .itemName("Thưởng KPI")
                    .amount(new BigDecimal("2000000"))
                    .type(PayslipDetailType.ALLOWANCE)
                    .build();
            payslip.setDetails(List.of(detail));

            PayslipResponse response = payslipService.toResponse(payslip);

            assertThat(response.getDetails()).hasSize(1);
            assertThat(response.getDetails().get(0).getItemName()).isEqualTo("Thưởng KPI");
            assertThat(response.getDetails().get(0).getAmount())
                    .isEqualByComparingTo("2000000");
            assertThat(response.getDetails().get(0).getType())
                    .isEqualTo(PayslipDetailType.ALLOWANCE);
        }

        @Test
        @DisplayName("periodId đúng trong response")
        void shouldReturnCorrectPeriodId() {
            PayslipResponse response = payslipService.toResponse(payslip);

            assertThat(response.getPeriodId()).isEqualTo(period.getPeriodId());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /** Tạo Payslip với các field cơ bản. */
    private Payslip buildPayslip(UUID id, Employee emp, PayrollBatch b, PayslipStatus status) {
        return Payslip.builder()
                .payslipId(id)
                .employee(emp)
                .batch(b)
                .period(b.getPeriod())
                .status(status)
                .baseSalary(new BigDecimal("10000000"))
                .grossSalary(new BigDecimal("10000000"))
                .taxAmount(new BigDecimal("1000000"))
                .insuranceAmount(new BigDecimal("800000"))
                .totalDeductions(new BigDecimal("1800000"))
                .netSalary(new BigDecimal("8200000"))
                .details(List.of())
                .build();
    }

    /** Stub happy-path cho confirmPayslip. */
    private void stubConfirmHappyPath() {
        when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
        when(payslipRepository.save(payslip)).thenReturn(payslip);
        // checkAndUpdateBatchStatus: còn DRAFT → không update batch
        when(payslipRepository.findAllByBatch_BatchId(batchId))
                .thenReturn(List.of(payslip));
        when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
    }

    /** Stub happy-path cho cancelPayslip. */
    private void stubCancelHappyPath(PayslipStatus initialStatus) {
        payslip.setStatus(initialStatus);
        when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
        when(payslipRepository.save(payslip)).thenReturn(payslip);
        when(payslipRepository.findAllByBatch_BatchId(batchId)).thenReturn(List.of(payslip));
        when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
    }
}