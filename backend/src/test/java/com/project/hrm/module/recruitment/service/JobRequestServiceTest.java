package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import com.project.hrm.module.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.module.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.module.recruitment.entity.JobRequest;
import com.project.hrm.module.recruitment.enums.RequestStatus;
import com.project.hrm.module.recruitment.repository.JobRequestRepository;
import com.project.hrm.module.recruitment.service.impl.JobRequestServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobRequestServiceImpl — Unit Tests")
class JobRequestServiceTest {

    // ─────────────────────────────── mocks ────────────────────────────────
    @Mock private JobRequestRepository jobRequestRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private PositionRepository   positionRepository;
    @Mock private EmployeeRepository   employeeRepository;

    @InjectMocks
    private JobRequestServiceImpl jobRequestService;

    // ─────────────────────────────── fixtures ─────────────────────────────
    private UUID requestId;
    private UUID deptId;
    private UUID posId;
    private UUID employeeId;

    private Department department;
    private Position   position;
    private Employee   employee;
    private JobRequest jobRequest;

    @BeforeEach
    void setUp() {
        requestId  = UUID.randomUUID();
        deptId     = UUID.randomUUID();
        posId      = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        department = new Department();
        department.setDeptId(deptId);
        department.setDeptName("Engineering");

        position = new Position();
        position.setPositionId(posId);
        position.setTitle("Backend Engineer");

        employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setFullName("HR Staff");

        jobRequest = new JobRequest();
        jobRequest.setId(requestId);
        jobRequest.setDept(department);
        jobRequest.setPos(position);
        jobRequest.setQuantity(2);
        jobRequest.setLocation("Hanoi");
        jobRequest.setReason("Team expansion");
        jobRequest.setStatus(RequestStatus.SUBMITTED);
        jobRequest.setCreatedAt(OffsetDateTime.now());
    }

    // helper: request hợp lệ — deptId và posId luôn required (không còn null check)
    private JobRequestRequest buildRequest(int quantity) {
        JobRequestRequest req = new JobRequestRequest();
        req.setDeptId(deptId);
        req.setPosId(posId);
        req.setQuantity(quantity);
        req.setLocation("Hanoi");
        req.setReason("Team expansion");
        return req;
    }

    // helper: stub toàn bộ uploadData dependencies
    private void stubUploadData() {
        when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
        when(positionRepository.findById(posId)).thenReturn(Optional.of(position));
        when(jobRequestRepository.save(any(JobRequest.class))).thenReturn(jobRequest);
    }

    // ====================================================================
    // uploadData() — test gián tiếp qua create() và update()
    // ====================================================================
    @Nested
    @DisplayName("uploadData() — via create() & update()")
    class UploadData {

        // ── Guard: quantity ──────────────────────────────────────────────

        @Test
        @DisplayName("quantity = 0 — ném IllegalArgumentException, không gọi bất kỳ repository nào")
        void uploadData_zeroQuantity_throwsBeforeAnyRepositoryCall() {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> jobRequestService.create(buildRequest(0)));

            assertEquals("Quantity must be greater than 0", ex.getMessage());
            verifyNoInteractions(departmentRepository, positionRepository, jobRequestRepository);
        }

        @Test
        @DisplayName("quantity âm — ném IllegalArgumentException")
        void uploadData_negativeQuantity_throwsIllegalArgumentException() {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> jobRequestService.create(buildRequest(-5)));

            assertEquals("Quantity must be greater than 0", ex.getMessage());
        }

        @Test
        @DisplayName("quantity = 1 (biên dưới hợp lệ) — không throw")
        void uploadData_quantityOne_doesNotThrow() {
            stubUploadData();
            assertDoesNotThrow(() -> jobRequestService.create(buildRequest(1)));
        }

        // ── Guard: department ────────────────────────────────────────────

        @Test
        @DisplayName("Department không tồn tại — ném RuntimeException, không lưu")
        void uploadData_departmentNotFound_throwsRuntimeException() {
            when(departmentRepository.findById(deptId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobRequestService.create(buildRequest(1)));

            assertEquals("Department not found", ex.getMessage());
            verify(jobRequestRepository, never()).save(any());
        }

        // ── Guard: position ──────────────────────────────────────────────

        @Test
        @DisplayName("Position không tồn tại — ném RuntimeException, không lưu")
        void uploadData_positionNotFound_throwsRuntimeException() {
            when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
            when(positionRepository.findById(posId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobRequestService.create(buildRequest(1)));

            assertEquals("Position not found", ex.getMessage());
            verify(jobRequestRepository, never()).save(any());
        }

        // ── Verify fields được set đúng vào entity ───────────────────────

        @Test
        @DisplayName("Tất cả fields được set đúng vào entity trước khi save")
        void uploadData_valid_setsAllFieldsCorrectly() {
            JobRequestRequest req = buildRequest(3);
            req.setLocation("Ho Chi Minh");
            req.setReason("New project");
            stubUploadData();

            jobRequestService.create(req);

            var captor = ArgumentCaptor.forClass(JobRequest.class);
            verify(jobRequestRepository).save(captor.capture());
            JobRequest saved = captor.getValue();

            assertEquals(3,                    saved.getQuantity());
            assertEquals("Ho Chi Minh",        saved.getLocation());
            assertEquals("New project",        saved.getReason());
            assertEquals(RequestStatus.SUBMITTED, saved.getStatus());
            assertEquals(department,           saved.getDept());
            assertEquals(position,             saved.getPos());
            assertNotNull(saved.getCreatedAt());
        }

        @Test
        @DisplayName("status luôn được set là SUBMITTED (bất kể request truyền gì)")
        void uploadData_valid_statusAlwaysSubmitted() {
            stubUploadData();

            jobRequestService.create(buildRequest(2));

            verify(jobRequestRepository).save(argThat(e ->
                    e.getStatus() == RequestStatus.SUBMITTED));
        }

        @Test
        @DisplayName("createdAt được set không null và gần thời điểm gọi")
        void uploadData_valid_createdAtIsSetNearNow() {
            stubUploadData();
            OffsetDateTime before = OffsetDateTime.now();

            jobRequestService.create(buildRequest(2));

            OffsetDateTime after = OffsetDateTime.now();
            var captor = ArgumentCaptor.forClass(JobRequest.class);
            verify(jobRequestRepository).save(captor.capture());
            OffsetDateTime createdAt = captor.getValue().getCreatedAt();

            assertNotNull(createdAt);
            assertFalse(createdAt.isBefore(before), "createdAt không được trước thời điểm gọi");
            assertFalse(createdAt.isAfter(after),   "createdAt không được sau thời điểm kết thúc");
        }

        // ── Reuse qua update() ───────────────────────────────────────────

        @Test
        @DisplayName("update() cũng dùng uploadData — quantity = 0 ném IllegalArgumentException")
        void uploadData_viaUpdate_zeroQuantity_throwsIllegalArgumentException() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));

            assertThrows(IllegalArgumentException.class,
                    () -> jobRequestService.update(requestId, buildRequest(0)));
            verify(jobRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("update() cũng dùng uploadData — department not found ném RuntimeException")
        void uploadData_viaUpdate_departmentNotFound_throwsRuntimeException() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));
            when(departmentRepository.findById(deptId)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> jobRequestService.update(requestId, buildRequest(2)));
            verify(jobRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("update() — entity hiện tại được cập nhật đúng fields")
        void uploadData_viaUpdate_updatesExistingEntityFields() {
            JobRequestRequest req = buildRequest(5);
            req.setLocation("Da Nang");
            req.setReason("Urgent hire");

            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));
            when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
            when(positionRepository.findById(posId)).thenReturn(Optional.of(position));
            when(jobRequestRepository.save(any())).thenReturn(jobRequest);

            jobRequestService.update(requestId, req);

            var captor = ArgumentCaptor.forClass(JobRequest.class);
            verify(jobRequestRepository).save(captor.capture());
            JobRequest saved = captor.getValue();

            assertEquals(requestId,                saved.getId());   // giữ nguyên id
            assertEquals(5,                        saved.getQuantity());
            assertEquals("Da Nang",               saved.getLocation());
            assertEquals("Urgent hire",           saved.getReason());
            assertEquals(RequestStatus.SUBMITTED, saved.getStatus());
        }
    }

    // ====================================================================
    // create()
    // ====================================================================
    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Request hợp lệ — gọi save đúng 1 lần, trả về response không null")
        void create_valid_savesOnceAndReturnsResponse() {
            stubUploadData();

            JobRequestResponse response = jobRequestService.create(buildRequest(2));

            assertNotNull(response);
            verify(jobRequestRepository, times(1)).save(any(JobRequest.class));
        }

        @Test
        @DisplayName("Tạo entity mới (không phải update) — id ban đầu là null")
        void create_alwaysCreatesNewEntity() {
            stubUploadData();

            jobRequestService.create(buildRequest(2));

            var captor = ArgumentCaptor.forClass(JobRequest.class);
            verify(jobRequestRepository).save(captor.capture());
            // entity mới tạo bằng new JobRequest() → id null trước khi DB assign
            assertNull(captor.getValue().getId());
        }
    }

    // ====================================================================
    // getAllRequest()
    // ====================================================================
    @Nested
    @DisplayName("getAllRequest()")
    class GetAllRequest {

        @Test
        @DisplayName("Có dữ liệu — trả về toàn bộ danh sách")
        void getAllRequest_hasData_returnsList() {
            when(jobRequestRepository.findAll()).thenReturn(List.of(jobRequest));

            List<JobRequestResponse> result = jobRequestService.getAllRequest();

            assertEquals(1, result.size());
            verify(jobRequestRepository).findAll();
        }

        @Test
        @DisplayName("Không có dữ liệu — trả về danh sách rỗng")
        void getAllRequest_empty_returnsEmptyList() {
            when(jobRequestRepository.findAll()).thenReturn(List.of());

            assertTrue(jobRequestService.getAllRequest().isEmpty());
        }
    }

    // ====================================================================
    // getRequestByDepartmentName()
    // ====================================================================
    @Nested
    @DisplayName("getRequestByDepartmentName()")
    class GetRequestByDepartmentName {

        @Test
        @DisplayName("Có kết quả — gọi repository với sort desc createdAt, trả về list")
        void getRequestByDepartmentName_found_returnsSortedList() {
            when(jobRequestRepository.findByDept_DeptNameAndStatus(
                    eq("Engineering"), eq(RequestStatus.SUBMITTED), any(Sort.class)))
                    .thenReturn(List.of(jobRequest));

            List<JobRequestResponse> result = jobRequestService
                    .getRequestByDepartmentName("Engineering", RequestStatus.SUBMITTED);

            assertEquals(1, result.size());
            verify(jobRequestRepository).findByDept_DeptNameAndStatus(
                    eq("Engineering"), eq(RequestStatus.SUBMITTED), any(Sort.class));
        }

        @Test
        @DisplayName("Không có kết quả — trả về danh sách rỗng")
        void getRequestByDepartmentName_noMatch_returnsEmptyList() {
            when(jobRequestRepository.findByDept_DeptNameAndStatus(any(), any(), any()))
                    .thenReturn(List.of());

            assertTrue(jobRequestService
                    .getRequestByDepartmentName("Unknown", RequestStatus.APPROVED).isEmpty());
        }
    }

    // ====================================================================
    // getRequestByReportTo()
    // ====================================================================
    @Nested
    @DisplayName("getRequestByReportTo()")
    class GetRequestByReportTo {

        @Test
        @DisplayName("Có kết quả — gọi repository với đúng employeeId, status, sort")
        void getRequestByReportTo_found_returnsList() {
            when(jobRequestRepository.findByReportsTo_EmployeeIdAndStatus(
                    eq(employeeId), eq(RequestStatus.SUBMITTED), any(Sort.class)))
                    .thenReturn(List.of(jobRequest));

            List<JobRequestResponse> result = jobRequestService
                    .getRequestByReportTo(employeeId, RequestStatus.SUBMITTED);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Không có kết quả — trả về danh sách rỗng")
        void getRequestByReportTo_noMatch_returnsEmptyList() {
            when(jobRequestRepository.findByReportsTo_EmployeeIdAndStatus(any(), any(), any()))
                    .thenReturn(List.of());

            assertTrue(jobRequestService
                    .getRequestByReportTo(employeeId, RequestStatus.APPROVED).isEmpty());
        }
    }

    // ====================================================================
    // getRequestByHr()
    // ====================================================================
    @Nested
    @DisplayName("getRequestByHr()")
    class GetRequestByHr {

        @Test
        @DisplayName("Có request SUBMITTED và reportsTo null — trả về danh sách")
        void getRequestByHr_hasSubmitted_returnsList() {
            when(jobRequestRepository.findByStatusAndReportsToIsNull(RequestStatus.SUBMITTED))
                    .thenReturn(List.of(jobRequest));

            assertEquals(1, jobRequestService.getRequestByHr().size());
        }

        @Test
        @DisplayName("Danh sách rỗng — return List.of() ngay lập tức, không stream")
        void getRequestByHr_empty_returnsEmptyEarly() {
            when(jobRequestRepository.findByStatusAndReportsToIsNull(RequestStatus.SUBMITTED))
                    .thenReturn(List.of());

            assertTrue(jobRequestService.getRequestByHr().isEmpty());
        }
    }

    // ====================================================================
    // choiceHr()
    // ====================================================================
    @Nested
    @DisplayName("choiceHr()")
    class ChoiceHr {

        @Test
        @DisplayName("Hợp lệ — set reportsTo cho từng request, trả về list")
        void choiceHr_valid_setsReportsToAndReturnsList() {
            List<UUID> ids = List.of(requestId);
            when(jobRequestRepository.findAllById(ids)).thenReturn(List.of(jobRequest));
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

            List<JobRequestResponse> result = jobRequestService.choiceHr(employeeId, ids);

            assertEquals(1, result.size());
            assertEquals(employee, jobRequest.getReportsTo());
        }

        @Test
        @DisplayName("Nhiều request — tất cả đều được set cùng một employee")
        void choiceHr_multipleRequests_setsReportsToForAll() {
            JobRequest request2 = new JobRequest();
            request2.setId(UUID.randomUUID());
            request2.setDept(department);
            request2.setPos(position);
            request2.setStatus(RequestStatus.SUBMITTED);

            List<UUID> ids = List.of(requestId, request2.getId());
            when(jobRequestRepository.findAllById(ids)).thenReturn(List.of(jobRequest, request2));
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

            jobRequestService.choiceHr(employeeId, ids);

            assertEquals(employee, jobRequest.getReportsTo());
            assertEquals(employee, request2.getReportsTo());
        }

        @Test
        @DisplayName("Employee không tồn tại — ném RuntimeException chứa employeeId")
        void choiceHr_employeeNotFound_throwsRuntimeException() {
            when(jobRequestRepository.findAllById(any())).thenReturn(List.of(jobRequest));
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobRequestService.choiceHr(employeeId, List.of(requestId)));
            assertTrue(ex.getMessage().contains(employeeId.toString()));
        }
    }

    // ====================================================================
    // getRequestById()
    // ====================================================================
    @Nested
    @DisplayName("getRequestById()")
    class GetRequestById {

        @Test
        @DisplayName("Id hợp lệ — trả về response đúng dữ liệu")
        void getRequestById_found_returnsCorrectResponse() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));

            JobRequestResponse response = jobRequestService.getRequestById(requestId);

            assertNotNull(response);
            assertEquals(requestId, response.getId());
            assertEquals(posId,     response.getPosId());
            assertEquals(deptId,    response.getDeptId());
        }

        @Test
        @DisplayName("Id không tồn tại — ném RuntimeException chứa id")
        void getRequestById_notFound_throwsRuntimeException() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobRequestService.getRequestById(requestId));
            assertTrue(ex.getMessage().contains(requestId.toString()));
        }
    }

    // ====================================================================
    // update()
    // ====================================================================
    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Hợp lệ — tìm entity, gọi uploadData, lưu")
        void update_valid_findsAndSaves() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));
            stubUploadData();

            JobRequestResponse response = jobRequestService.update(requestId, buildRequest(5));

            assertNotNull(response);
            verify(jobRequestRepository).save(any(JobRequest.class));
        }

        @Test
        @DisplayName("Request không tồn tại — ném RuntimeException chứa id, không lưu")
        void update_notFound_throwsRuntimeException() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobRequestService.update(requestId, buildRequest(1)));

            assertTrue(ex.getMessage().contains(requestId.toString()));
            verify(jobRequestRepository, never()).save(any());
        }

        // Các case lỗi của uploadData (quantity, dept, pos) đã được
        // cover trong @Nested UploadData ở trên.
    }

    // ====================================================================
    // updateStatus()
    // ====================================================================
    @Nested
    @DisplayName("updateStatus()")
    class UpdateStatus {

        @Test
        @DisplayName("SUBMITTED → APPROVED — cập nhật status, lưu")
        void updateStatus_submitToApproved_savesCorrectly() {
            jobRequest.setStatus(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));
            when(jobRequestRepository.save(any())).thenReturn(jobRequest);

            JobRequestResponse response = jobRequestService
                    .updateStatus(requestId, RequestStatus.APPROVED, null);

            assertNotNull(response);
            assertEquals(RequestStatus.APPROVED, jobRequest.getStatus());
            verify(jobRequestRepository).save(jobRequest);
        }

        @Test
        @DisplayName("SUBMITTED → REJECTED với comment — lưu status và hrComment")
        void updateStatus_rejectWithComment_savesStatusAndComment() {
            jobRequest.setStatus(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));
            when(jobRequestRepository.save(any())).thenReturn(jobRequest);

            jobRequestService.updateStatus(requestId, RequestStatus.REJECTED, "Not enough budget");

            assertEquals(RequestStatus.REJECTED,   jobRequest.getStatus());
            assertEquals("Not enough budget", jobRequest.getHrComment());
        }

        @Test
        @DisplayName("APPROVED với comment không null — comment được lưu vào hrComment")
        void updateStatus_approveWithComment_savesComment() {
            jobRequest.setStatus(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));
            when(jobRequestRepository.save(any())).thenReturn(jobRequest);

            jobRequestService.updateStatus(requestId, RequestStatus.APPROVED, "Looks good");

            assertEquals("Looks good", jobRequest.getHrComment());
        }

        @Test
        @DisplayName("REJECTED comment null — ném IllegalArgumentException, không lưu")
        void updateStatus_rejectNullComment_throwsIllegalArgumentException() {
            jobRequest.setStatus(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> jobRequestService.updateStatus(requestId, RequestStatus.REJECTED, null));

            assertEquals("Comment is required when rejecting", ex.getMessage());
            verify(jobRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("REJECTED comment blank (\"   \") — ném IllegalArgumentException, không lưu")
        void updateStatus_rejectBlankComment_throwsIllegalArgumentException() {
            jobRequest.setStatus(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));

            assertThrows(IllegalArgumentException.class,
                    () -> jobRequestService.updateStatus(requestId, RequestStatus.REJECTED, "   "));
            verify(jobRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Status đã APPROVED — ném IllegalStateException, không lưu")
        void updateStatus_alreadyApproved_throwsIllegalStateException() {
            jobRequest.setStatus(RequestStatus.APPROVED);
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> jobRequestService.updateStatus(requestId, RequestStatus.REJECTED, "x"));

            assertEquals("Request already processed", ex.getMessage());
            verify(jobRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Status đã REJECTED — ném IllegalStateException, không lưu")
        void updateStatus_alreadyRejected_throwsIllegalStateException() {
            jobRequest.setStatus(RequestStatus.REJECTED);
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> jobRequestService.updateStatus(requestId, RequestStatus.APPROVED, null));

            assertEquals("Request already processed", ex.getMessage());
            verify(jobRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Request không tồn tại — ném RuntimeException chứa id")
        void updateStatus_notFound_throwsRuntimeException() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobRequestService.updateStatus(requestId, RequestStatus.APPROVED, null));
            assertTrue(ex.getMessage().contains(requestId.toString()));
        }
    }

    // ====================================================================
    // delete()
    // ====================================================================
    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Request tồn tại — xóa thành công")
        void delete_existing_deletesSuccessfully() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.of(jobRequest));
            doNothing().when(jobRequestRepository).delete(jobRequest);

            assertDoesNotThrow(() -> jobRequestService.delete(requestId));
            verify(jobRequestRepository).delete(jobRequest);
        }

        @Test
        @DisplayName("Request không tồn tại — ném RuntimeException, không gọi delete")
        void delete_notFound_throwsAndNeverCallsDelete() {
            when(jobRequestRepository.findById(requestId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobRequestService.delete(requestId));

            assertTrue(ex.getMessage().contains(requestId.toString()));
            verify(jobRequestRepository, never()).delete(any());
        }
    }
}