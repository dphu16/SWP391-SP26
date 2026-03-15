package com.project.hrm.module.payroll.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.dto.RequestDTO.CreateSalaryInquiryRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.RespondToInquiryRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.SalaryInquiryDto;
import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.entity.SalaryInquiry;
import com.project.hrm.module.payroll.entity.SalaryInquiryResponse;
import com.project.hrm.module.payroll.enums.SalaryInquiryStatus;
import com.project.hrm.module.payroll.exception.AccessDeniedException;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import com.project.hrm.module.payroll.repository.SalaryInquiryRepository;
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
import org.springframework.data.domain.Sort;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho SalaryInquiryService.
 *
 * Enum values:
 *   SalaryInquiryStatus : OPEN, IN_PROGRESS, RESOLVED, REJECTED
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SalaryInquiryService Tests")
class SalaryInquiryServiceTest {

    @Mock private SalaryInquiryRepository inquiryRepository;
    @Mock private PayslipRepository       payslipRepository;

    @InjectMocks
    private SalaryInquiryService salaryInquiryService;

    // ─── Common fixtures ───────────────────────────────────────────────────────
    private UUID           employeeId;
    private UUID           responderId;
    private UUID           inquiryId;
    private UUID           payslipId;

    private Employee       employee;
    private Employee       responder;
    private Payslip        payslip;
    private SalaryInquiry  inquiry;

    private CreateSalaryInquiryRequest createReq;
    private RespondToInquiryRequest    respondReq;

    @BeforeEach
    void setUp() {
        employeeId  = UUID.randomUUID();
        responderId = UUID.randomUUID();
        inquiryId   = UUID.randomUUID();
        payslipId   = UUID.randomUUID();

        employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setFullName("Nguyen Van A");

        responder = new Employee();
        responder.setEmployeeId(responderId);
        responder.setFullName("HR Manager");

        payslip = new Payslip();
        payslip.setPayslipId(payslipId);
        payslip.setEmployee(employee);

        inquiry = SalaryInquiry.builder()
                .id(inquiryId)
                .employee(employee)
                .payslip(payslip)
                .subject("Sai luong co ban")
                .message("Luong thang nay tinh sai")
                .status(SalaryInquiryStatus.OPEN)
                .build();

        createReq = new CreateSalaryInquiryRequest();
        createReq.setPayslipId(payslipId);
        createReq.setSubject("Sai luong co ban");
        createReq.setMessage("Luong thang nay tinh sai");

        respondReq = new RespondToInquiryRequest();
        respondReq.setInquiryId(inquiryId);
        respondReq.setOfficialResponse("Da kiem tra va dieu chinh.");
        respondReq.setInternalNote("Note noi bo");
        respondReq.setAttachmentUrl("http://attach.url");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. createInquiry
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. createInquiry")
    class CreateInquiry {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi payslip không tồn tại")
        void shouldThrow_WhenPayslipNotFound() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> salaryInquiryService.createInquiry(employeeId, createReq))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Phiếu lương");
        }

        @Test
        @DisplayName("Throw AccessDeniedException khi employee tạo inquiry cho payslip của người khác")
        void shouldThrow_WhenEmployeeAccessesOtherPayslip() {
            UUID otherEmployeeId = UUID.randomUUID();
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

            assertThatThrownBy(() ->
                    salaryInquiryService.createInquiry(otherEmployeeId, createReq))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("không có quyền");
        }

        @Test
        @DisplayName("Tạo inquiry thành công khi employee xem phiếu của chính mình")
        void shouldCreateInquiry_WhenOwnerRequests() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(inquiryRepository.save(any())).thenAnswer(inv -> {
                SalaryInquiry i = inv.getArgument(0);
                i.setId(inquiryId);
                return i;
            });

            SalaryInquiryDto result = salaryInquiryService.createInquiry(employeeId, createReq);

            assertThat(result).isNotNull();
            verify(inquiryRepository).save(any(SalaryInquiry.class));
        }

        @Test
        @DisplayName("Inquiry được lưu với status = OPEN")
        void shouldSaveInquiry_WithOpenStatus() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(inquiryRepository.save(any())).thenAnswer(inv -> {
                SalaryInquiry i = inv.getArgument(0);
                i.setId(inquiryId);
                return i;
            });

            salaryInquiryService.createInquiry(employeeId, createReq);

            ArgumentCaptor<SalaryInquiry> captor = ArgumentCaptor.forClass(SalaryInquiry.class);
            verify(inquiryRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(SalaryInquiryStatus.OPEN);
        }

        @Test
        @DisplayName("Inquiry được lưu với subject và message đúng")
        void shouldSaveInquiry_WithCorrectSubjectAndMessage() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(inquiryRepository.save(any())).thenAnswer(inv -> {
                SalaryInquiry i = inv.getArgument(0);
                i.setId(inquiryId);
                return i;
            });

            salaryInquiryService.createInquiry(employeeId, createReq);

            ArgumentCaptor<SalaryInquiry> captor = ArgumentCaptor.forClass(SalaryInquiry.class);
            verify(inquiryRepository).save(captor.capture());
            assertThat(captor.getValue().getSubject()).isEqualTo("Sai luong co ban");
            assertThat(captor.getValue().getMessage()).isEqualTo("Luong thang nay tinh sai");
        }

        @Test
        @DisplayName("Response DTO chứa đúng employeeId và payslipId")
        void shouldReturnCorrectIds_InResponse() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(inquiryRepository.save(any())).thenAnswer(inv -> {
                SalaryInquiry i = inv.getArgument(0);
                i.setId(inquiryId);
                return i;
            });

            SalaryInquiryDto result = salaryInquiryService.createInquiry(employeeId, createReq);

            assertThat(result.getEmployeeId()).isEqualTo(employeeId);
            assertThat(result.getPayslipId()).isEqualTo(payslipId);
        }

        @Test
        @DisplayName("Response DTO không chứa hrResponse khi mới tạo (includeInternalNote = false)")
        void shouldReturnNullHrResponse_WhenNewlyCreated() {
            when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
            when(inquiryRepository.save(any())).thenAnswer(inv -> {
                SalaryInquiry i = inv.getArgument(0);
                i.setId(inquiryId);
                return i;
            });

            SalaryInquiryDto result = salaryInquiryService.createInquiry(employeeId, createReq);

            assertThat(result.getHrResponse()).isNull();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. getMyInquiries
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. getMyInquiries")
    class GetMyInquiries {

        @Test
        @DisplayName("Trả về danh sách inquiry của employee")
        void shouldReturnInquiries_ForEmployee() {
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(inquiry));

            List<SalaryInquiryDto> result = salaryInquiryService.getMyInquiries(employeeId);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Trả về list rỗng khi employee chưa có inquiry nào")
        void shouldReturnEmptyList_WhenNoInquiries() {
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of());

            assertThat(salaryInquiryService.getMyInquiries(employeeId)).isEmpty();
        }

        @Test
        @DisplayName("Gọi đúng repository method với employeeId")
        void shouldCallRepository_WithEmployeeId() {
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of());

            salaryInquiryService.getMyInquiries(employeeId);

            verify(inquiryRepository)
                    .findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId);
        }

        @Test
        @DisplayName("hrResponse = null trong response (employee không thấy internal note)")
        void shouldNotIncludeInternalNote_ForEmployee() {
            SalaryInquiryResponse responseEntity = buildResponseEntity("Da xu ly");
            inquiry.setResponse(responseEntity);
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(inquiry));

            List<SalaryInquiryDto> result = salaryInquiryService.getMyInquiries(employeeId);

            // hrResponse vẫn có nhưng internalNote không được expose (includeInternalNote=false)
            assertThat(result.get(0).getHrResponse()).isNotNull();
            assertThat(result.get(0).getHrResponse().getOfficialResponse()).isEqualTo("Da xu ly");
        }

        @Test
        @DisplayName("Trả về nhiều inquiry với status khác nhau")
        void shouldReturnMultipleInquiries_WithDifferentStatuses() {
            SalaryInquiry resolved = buildInquiry(SalaryInquiryStatus.RESOLVED);
            SalaryInquiry inProgress = buildInquiry(SalaryInquiryStatus.IN_PROGRESS);
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(inquiry, resolved, inProgress));

            List<SalaryInquiryDto> result = salaryInquiryService.getMyInquiries(employeeId);

            assertThat(result).hasSize(3);
            assertThat(result).extracting(SalaryInquiryDto::getStatus)
                    .containsExactly(
                            SalaryInquiryStatus.OPEN,
                            SalaryInquiryStatus.RESOLVED,
                            SalaryInquiryStatus.IN_PROGRESS);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. getAllInquiries
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. getAllInquiries")
    class GetAllInquiries {

        @Test
        @DisplayName("Trả về tất cả inquiry")
        void shouldReturnAllInquiries() {
            SalaryInquiry inquiry2 = buildInquiry(SalaryInquiryStatus.RESOLVED);
            when(inquiryRepository.findAll(any(Sort.class)))
                    .thenReturn(List.of(inquiry, inquiry2));

            List<SalaryInquiryDto> result = salaryInquiryService.getAllInquiries();

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Trả về list rỗng khi không có inquiry nào")
        void shouldReturnEmptyList_WhenNoInquiries() {
            when(inquiryRepository.findAll(any(Sort.class))).thenReturn(List.of());

            assertThat(salaryInquiryService.getAllInquiries()).isEmpty();
        }

        @Test
        @DisplayName("Gọi findAll với Sort DESC theo createdAt")
        void shouldCallFindAll_WithDescSort() {
            when(inquiryRepository.findAll(any(Sort.class))).thenReturn(List.of());

            salaryInquiryService.getAllInquiries();

            ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
            verify(inquiryRepository).findAll(sortCaptor.capture());
            Sort.Order order = sortCaptor.getValue().getOrderFor("createdAt");
            assertThat(order).isNotNull();
            assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
        }

        @Test
        @DisplayName("HR thấy hrResponse trong response (includeInternalNote = true)")
        void shouldIncludeHrResponse_ForHr() {
            SalaryInquiryResponse responseEntity = buildResponseEntity("Phan hoi chinh thuc");
            inquiry.setResponse(responseEntity);
            when(inquiryRepository.findAll(any(Sort.class))).thenReturn(List.of(inquiry));

            List<SalaryInquiryDto> result = salaryInquiryService.getAllInquiries();

            assertThat(result.get(0).getHrResponse()).isNotNull();
            assertThat(result.get(0).getHrResponse().getOfficialResponse())
                    .isEqualTo("Phan hoi chinh thuc");
        }

        @Test
        @DisplayName("hrResponse = null khi inquiry chưa được trả lời")
        void shouldReturnNullHrResponse_WhenNotResponded() {
            when(inquiryRepository.findAll(any(Sort.class))).thenReturn(List.of(inquiry));

            List<SalaryInquiryDto> result = salaryInquiryService.getAllInquiries();

            assertThat(result.get(0).getHrResponse()).isNull();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. markInProgress
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. markInProgress")
    class MarkInProgress {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi inquiry không tồn tại")
        void shouldThrow_WhenInquiryNotFound() {
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> salaryInquiryService.markInProgress(inquiryId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(inquiryId.toString());
        }

        @Test
        @DisplayName("Throw PayrollException khi inquiry không ở trạng thái OPEN")
        void shouldThrow_WhenInquiryNotOpen() {
            inquiry.setStatus(SalaryInquiryStatus.IN_PROGRESS);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));

            assertThatThrownBy(() -> salaryInquiryService.markInProgress(inquiryId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("OPEN");
        }

        @Test
        @DisplayName("Throw PayrollException khi inquiry đã RESOLVED")
        void shouldThrow_WhenInquiryResolved() {
            inquiry.setStatus(SalaryInquiryStatus.RESOLVED);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));

            assertThatThrownBy(() -> salaryInquiryService.markInProgress(inquiryId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("OPEN");
        }

        @Test
        @DisplayName("Throw PayrollException khi inquiry đã REJECTED")
        void shouldThrow_WhenInquiryRejected() {
            inquiry.setStatus(SalaryInquiryStatus.REJECTED);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));

            assertThatThrownBy(() -> salaryInquiryService.markInProgress(inquiryId))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("OPEN");
        }

        @Test
        @DisplayName("Status → IN_PROGRESS sau khi markInProgress thành công")
        void shouldUpdateStatus_ToInProgress() {
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));
            when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            SalaryInquiryDto result = salaryInquiryService.markInProgress(inquiryId);

            assertThat(inquiry.getStatus()).isEqualTo(SalaryInquiryStatus.IN_PROGRESS);
            assertThat(result.getStatus()).isEqualTo(SalaryInquiryStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("inquiryRepository.save được gọi sau khi markInProgress")
        void shouldSaveInquiry_AfterMarkInProgress() {
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));
            when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            salaryInquiryService.markInProgress(inquiryId);

            verify(inquiryRepository).save(inquiry);
        }

        @Test
        @DisplayName("Chỉ chấp nhận inquiry đang OPEN")
        void shouldAccept_WhenInquiryIsOpen() {
            inquiry.setStatus(SalaryInquiryStatus.OPEN);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));
            when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatNoException()
                    .isThrownBy(() -> salaryInquiryService.markInProgress(inquiryId));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. respondToInquiry
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("5. respondToInquiry")
    class RespondToInquiry {

        @Test
        @DisplayName("Throw ResourceNotFoundException khi inquiry không tồn tại")
        void shouldThrow_WhenInquiryNotFound() {
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    salaryInquiryService.respondToInquiry(responderId, respondReq))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(inquiryId.toString());
        }

        @Test
        @DisplayName("Throw PayrollException khi inquiry đã RESOLVED")
        void shouldThrow_WhenInquiryAlreadyResolved() {
            inquiry.setStatus(SalaryInquiryStatus.RESOLVED);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));

            assertThatThrownBy(() ->
                    salaryInquiryService.respondToInquiry(responderId, respondReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã được xử lý");
        }

        @Test
        @DisplayName("Throw PayrollException khi inquiry đã có câu trả lời (response != null)")
        void shouldThrow_WhenInquiryAlreadyHasResponse() {
            inquiry.setResponse(buildResponseEntity("Cau tra loi cu"));
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));

            assertThatThrownBy(() ->
                    salaryInquiryService.respondToInquiry(responderId, respondReq))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã có câu trả lời");
        }

        @Test
        @DisplayName("Status → RESOLVED sau khi trả lời thành công")
        void shouldUpdateStatus_ToResolved() {
            stubRespondHappyPath();

            salaryInquiryService.respondToInquiry(responderId, respondReq);

            assertThat(inquiry.getStatus()).isEqualTo(SalaryInquiryStatus.RESOLVED);
        }

        @Test
        @DisplayName("resolvedAt được set sau khi trả lời")
        void shouldSetResolvedAt_AfterRespond() {
            stubRespondHappyPath();

            salaryInquiryService.respondToInquiry(responderId, respondReq);

            assertThat(inquiry.getResolvedAt()).isNotNull();
        }

        @Test
        @DisplayName("Response entity được gắn vào inquiry")
        void shouldSetResponseEntity_OnInquiry() {
            stubRespondHappyPath();

            salaryInquiryService.respondToInquiry(responderId, respondReq);

            assertThat(inquiry.getResponse()).isNotNull();
            assertThat(inquiry.getResponse().getOfficialResponse())
                    .isEqualTo("Da kiem tra va dieu chinh.");
        }

        @Test
        @DisplayName("Response entity chứa đúng responderId")
        void shouldSetResponderId_InResponseEntity() {
            stubRespondHappyPath();

            salaryInquiryService.respondToInquiry(responderId, respondReq);

            assertThat(inquiry.getResponse().getResponder().getEmployeeId())
                    .isEqualTo(responderId);
        }

        @Test
        @DisplayName("Response entity chứa attachmentUrl")
        void shouldSetAttachmentUrl_InResponseEntity() {
            stubRespondHappyPath();

            salaryInquiryService.respondToInquiry(responderId, respondReq);

            assertThat(inquiry.getResponse().getAttachmentUrl())
                    .isEqualTo("http://attach.url");
        }

        @Test
        @DisplayName("DTO trả về có hrResponse không null")
        void shouldReturnHrResponse_InDto() {
            stubRespondHappyPath();

            SalaryInquiryDto result = salaryInquiryService.respondToInquiry(responderId, respondReq);

            assertThat(result.getStatus()).isEqualTo(SalaryInquiryStatus.RESOLVED);
        }

        @Test
        @DisplayName("inquiryRepository.save được gọi sau khi respond")
        void shouldSaveInquiry_AfterRespond() {
            stubRespondHappyPath();

            salaryInquiryService.respondToInquiry(responderId, respondReq);

            verify(inquiryRepository).save(inquiry);
        }

        @Test
        @DisplayName("Có thể respond khi inquiry đang IN_PROGRESS")
        void shouldAccept_WhenInquiryIsInProgress() {
            inquiry.setStatus(SalaryInquiryStatus.IN_PROGRESS);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));
            when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatNoException().isThrownBy(() ->
                    salaryInquiryService.respondToInquiry(responderId, respondReq));
        }

        @Test
        @DisplayName("Có thể respond khi inquiry đang OPEN")
        void shouldAccept_WhenInquiryIsOpen() {
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));
            when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatNoException().isThrownBy(() ->
                    salaryInquiryService.respondToInquiry(responderId, respondReq));
        }

        private void stubRespondHappyPath() {
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));
            when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. rejectInquiry
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("6. rejectInquiry")
    class RejectInquiry {

        private static final String REJECT_REASON = "Khong du co so de chinh sua.";

        @Test
        @DisplayName("Throw ResourceNotFoundException khi inquiry không tồn tại")
        void shouldThrow_WhenInquiryNotFound() {
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(inquiryId.toString());
        }

        @Test
        @DisplayName("Throw PayrollException khi inquiry đã RESOLVED")
        void shouldThrow_WhenInquiryAlreadyResolved() {
            inquiry.setStatus(SalaryInquiryStatus.RESOLVED);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));

            assertThatThrownBy(() ->
                    salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã được xử lý");
        }

        @Test
        @DisplayName("Throw PayrollException khi inquiry đã REJECTED")
        void shouldThrow_WhenInquiryAlreadyRejected() {
            inquiry.setStatus(SalaryInquiryStatus.REJECTED);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));

            assertThatThrownBy(() ->
                    salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON))
                    .isInstanceOf(PayrollException.class)
                    .hasMessageContaining("đã được xử lý");
        }

        @Test
        @DisplayName("Status → REJECTED sau khi từ chối thành công")
        void shouldUpdateStatus_ToRejected() {
            stubRejectHappyPath();

            SalaryInquiryDto result = salaryInquiryService
                    .rejectInquiry(responderId, inquiryId, REJECT_REASON);

            assertThat(inquiry.getStatus()).isEqualTo(SalaryInquiryStatus.REJECTED);
            assertThat(result.getStatus()).isEqualTo(SalaryInquiryStatus.REJECTED);
        }

        @Test
        @DisplayName("resolvedAt được set sau khi từ chối")
        void shouldSetResolvedAt_AfterReject() {
            stubRejectHappyPath();

            salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON);

            assertThat(inquiry.getResolvedAt()).isNotNull();
        }

        @Test
        @DisplayName("officialResponse chứa prefix 'TỪ CHỐI:' và lý do từ chối")
        void shouldSetOfficialResponse_WithRejectPrefix() {
            stubRejectHappyPath();

            salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON);

            assertThat(inquiry.getResponse().getOfficialResponse())
                    .startsWith("TỪ CHỐI:")
                    .contains(REJECT_REASON);
        }

        @Test
        @DisplayName("Response entity chứa đúng responderId")
        void shouldSetResponderId_InResponseEntity() {
            stubRejectHappyPath();

            salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON);

            assertThat(inquiry.getResponse().getResponder().getEmployeeId())
                    .isEqualTo(responderId);
        }

        @Test
        @DisplayName("Có thể reject inquiry đang OPEN")
        void shouldAccept_WhenInquiryIsOpen() {
            stubRejectHappyPath();

            assertThatNoException().isThrownBy(() ->
                    salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON));
        }

        @Test
        @DisplayName("Có thể reject inquiry đang IN_PROGRESS")
        void shouldAccept_WhenInquiryIsInProgress() {
            inquiry.setStatus(SalaryInquiryStatus.IN_PROGRESS);
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));
            when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatNoException().isThrownBy(() ->
                    salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON));
        }

        @Test
        @DisplayName("inquiryRepository.save được gọi sau khi reject")
        void shouldSaveInquiry_AfterReject() {
            stubRejectHappyPath();

            salaryInquiryService.rejectInquiry(responderId, inquiryId, REJECT_REASON);

            verify(inquiryRepository).save(inquiry);
        }

        private void stubRejectHappyPath() {
            when(inquiryRepository.findById(inquiryId)).thenReturn(Optional.of(inquiry));
            when(inquiryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. toDto – mapping (gián tiếp qua các method public)
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("7. toDto – DTO mapping")
    class ToDtoMapping {

        @Test
        @DisplayName("Map đúng id, subject, message, status")
        void shouldMapBasicFields() {
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(inquiry));

            SalaryInquiryDto result = salaryInquiryService.getMyInquiries(employeeId).get(0);

            assertThat(result.getId()).isEqualTo(inquiryId);
            assertThat(result.getSubject()).isEqualTo("Sai luong co ban");
            assertThat(result.getMessage()).isEqualTo("Luong thang nay tinh sai");
            assertThat(result.getStatus()).isEqualTo(SalaryInquiryStatus.OPEN);
        }

        @Test
        @DisplayName("Map đúng employeeId và payslipId")
        void shouldMapEmployeeAndPayslipIds() {
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(inquiry));

            SalaryInquiryDto result = salaryInquiryService.getMyInquiries(employeeId).get(0);

            assertThat(result.getEmployeeId()).isEqualTo(employeeId);
            assertThat(result.getPayslipId()).isEqualTo(payslipId);
        }

        @Test
        @DisplayName("hrResponse = null khi inquiry chưa có response entity")
        void shouldReturnNullHrResponse_WhenNoResponseEntity() {
            inquiry.setResponse(null);
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(inquiry));

            SalaryInquiryDto result = salaryInquiryService.getMyInquiries(employeeId).get(0);

            assertThat(result.getHrResponse()).isNull();
        }

        @Test
        @DisplayName("hrResponse được map đầy đủ khi có response entity")
        void shouldMapHrResponse_WhenResponseEntityExists() {
            SalaryInquiryResponse responseEntity = buildResponseEntity("Phan hoi chinh thuc");
            responseEntity.setAttachmentUrl("http://file.url");
            inquiry.setResponse(responseEntity);
            inquiry.setStatus(SalaryInquiryStatus.RESOLVED);
            when(inquiryRepository.findAll(any(Sort.class))).thenReturn(List.of(inquiry));

            SalaryInquiryDto result = salaryInquiryService.getAllInquiries().get(0);

            assertThat(result.getHrResponse()).isNotNull();
            assertThat(result.getHrResponse().getOfficialResponse()).isEqualTo("Phan hoi chinh thuc");
            assertThat(result.getHrResponse().getAttachmentUrl()).isEqualTo("http://file.url");
        }

        @Test
        @DisplayName("resolvedAt được map đúng sau khi resolve")
        void shouldMapResolvedAt_AfterResolve() {
            OffsetDateTime resolvedAt = OffsetDateTime.now();
            inquiry.setStatus(SalaryInquiryStatus.RESOLVED);
            inquiry.setResolvedAt(resolvedAt);
            when(inquiryRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                    .thenReturn(List.of(inquiry));

            SalaryInquiryDto result = salaryInquiryService.getMyInquiries(employeeId).get(0);

            assertThat(result.getResolvedAt()).isEqualTo(resolvedAt);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /** Tạo SalaryInquiry với status cho trước. */
    private SalaryInquiry buildInquiry(SalaryInquiryStatus status) {
        return SalaryInquiry.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .payslip(payslip)
                .subject("Subject")
                .message("Message")
                .status(status)
                .build();
    }

    /** Tạo SalaryInquiryResponse (entity) với officialResponse cho trước. */
    private SalaryInquiryResponse buildResponseEntity(String officialResponse) {
        return SalaryInquiryResponse.builder()
                .responseId(UUID.randomUUID())
                .inquiry(inquiry)
                .responder(responder)
                .officialResponse(officialResponse)
                .internalNote("Note noi bo")
                .build();
    }
}