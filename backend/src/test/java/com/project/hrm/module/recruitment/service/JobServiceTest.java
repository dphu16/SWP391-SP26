package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import com.project.hrm.module.recruitment.dto.request.CreateJobRequest;
import com.project.hrm.module.recruitment.dto.response.JobResponse;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.entity.JobDetail;
import com.project.hrm.module.recruitment.entity.JobRequest;
import com.project.hrm.module.recruitment.enums.JobStatus;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import com.project.hrm.module.recruitment.repository.JobDetailRepository;
import com.project.hrm.module.recruitment.repository.JobRepository;
import com.project.hrm.module.recruitment.repository.JobRequestRepository;
import com.project.hrm.module.recruitment.service.impl.JobServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobServiceImpl — Unit Tests")
class JobServiceTest {

    // ─────────────────────────────── mocks ────────────────────────────────
    @Mock private JobRepository         jobRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private JobDetailRepository   jobDetailRepository;
    @Mock private EmployeeRepository    employeeRepository;
    @Mock private PositionRepository    positionRepository;
    @Mock private JobRequestRepository  jobRequestRepository;

    @InjectMocks
    private JobServiceImpl jobService;

    // ─────────────────────────────── fixtures ─────────────────────────────
    private UUID jobId;
    private UUID jobDetailId;
    private UUID employeeId;
    private UUID posId;
    private UUID deptId;
    private UUID jobRequestId;

    private Job        job;
    private JobDetail  jobDetail;
    private Employee   employee;
    private Position   position;
    private Department department;
    private JobRequest jobRequest;

    // Thời gian: postedAt = hôm nay, closedAt = +30 ngày (hợp lệ)
    private OffsetDateTime postedAt;
    private OffsetDateTime closedAt;

    @BeforeEach
    void setUp() {
        jobId       = UUID.randomUUID();
        jobDetailId = UUID.randomUUID();
        employeeId  = UUID.randomUUID();
        posId       = UUID.randomUUID();
        deptId      = UUID.randomUUID();
        jobRequestId = UUID.randomUUID();

        postedAt = OffsetDateTime.now().minusDays(1);
        closedAt = OffsetDateTime.now().plusDays(30);

        department = new Department();
        department.setDeptId(deptId);
        department.setDeptName("Engineering");

        position = new Position();
        position.setPositionId(posId);
        position.setTitle("Backend Engineer");
        position.setDepartment(department);
        position.setBaseSalaryMin(BigDecimal.valueOf(1000));
        position.setBaseSalaryMax(BigDecimal.valueOf(3000));

        employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setFullName("HR Manager");

        jobDetail = new JobDetail();
        jobDetail.setJobDetailId(jobDetailId);
        jobDetail.setQuantity(3);
        jobDetail.setMaxCv(100);
        jobDetail.setLocation("Hanoi");
        jobDetail.setDescription("Job description");
        jobDetail.setRequirements("Requirements");
        jobDetail.setResponsibilities("Responsibilities");
        jobDetail.setBenefits("Benefits");

        job = new Job();
        job.setId(jobId);
        job.setEmployee(employee);
        job.setPos(position);
        job.setJobDetail(jobDetail);
        job.setPostedAt(postedAt);
        job.setClosedAt(closedAt);
        job.setStatus(JobStatus.OPEN);

        jobRequest = new JobRequest();
        jobRequest.setId(jobRequestId);
        jobRequest.setPos(position);
        jobRequest.setReportsTo(employee);
    }

    // ─────────── helper tạo CreateJobRequest ───────────

    /** Request dùng requestId (không cần hrId/posId trực tiếp) */
    private CreateJobRequest buildRequestViaJobRequest(int quantity, int maxCv) {
        CreateJobRequest req = new CreateJobRequest();
        req.setRequestId(jobRequestId);
        req.setQuantity(quantity);
        req.setMaxCv(maxCv);
        req.setLocation("Hanoi");
        req.setDescription("desc");
        req.setRequirement("req");
        req.setResponsibility("resp");
        req.setBenefit("benefit");
        req.setPostedTime(postedAt);
        req.setClosedTime(closedAt);
        req.setStatus(JobStatus.OPEN);
        return req;
    }

    /** Request dùng hrId + posId trực tiếp (không có requestId) */
    private CreateJobRequest buildRequestDirect(int quantity, int maxCv) {
        CreateJobRequest req = new CreateJobRequest();
        req.setRequestId(null);
        req.setHrId(employeeId);
        req.setPosId(posId);
        req.setQuantity(quantity);
        req.setMaxCv(maxCv);
        req.setLocation("Hanoi");
        req.setDescription("desc");
        req.setRequirement("req");
        req.setResponsibility("resp");
        req.setBenefit("benefit");
        req.setPostedTime(postedAt);
        req.setClosedTime(closedAt);
        req.setStatus(JobStatus.OPEN);
        return req;
    }

    private void stubDirectLookup() {
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(positionRepository.findById(posId)).thenReturn(Optional.of(position));
    }

    private void stubJobDetailSave() {
        when(jobDetailRepository.save(any(JobDetail.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private void stubJobSave() {
        when(jobRepository.save(any(Job.class))).thenReturn(job);
    }

    // ====================================================================
    // create()
    // ====================================================================
    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Dùng requestId hợp lệ — lưu jobDetail + job, trả về response")
        void create_viaJobRequest_savesAndReturnsResponse() {
            when(jobRequestRepository.findById(jobRequestId)).thenReturn(Optional.of(jobRequest));
            stubJobDetailSave();
            stubJobSave();

            JobResponse response = jobService.create(buildRequestViaJobRequest(3, 100));

            assertNotNull(response);
            verify(jobDetailRepository).save(any(JobDetail.class));
            verify(jobRepository).save(any(Job.class));
        }

        @Test
        @DisplayName("Dùng hrId + posId trực tiếp — lưu jobDetail + job, trả về response")
        void create_direct_savesAndReturnsResponse() {
            stubDirectLookup();
            stubJobDetailSave();
            stubJobSave();

            JobResponse response = jobService.create(buildRequestDirect(3, 100));

            assertNotNull(response);
            verify(employeeRepository).findById(employeeId);
            verify(positionRepository).findById(posId);
        }

        @Test
        @DisplayName("quantity < 1 — ném RuntimeException trước khi lưu")
        void create_quantityZero_throwsRuntimeException() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.create(buildRequestDirect(0, 100)));
            assertEquals("Quantity must be between 1 and 100!", ex.getMessage());
            verifyNoInteractions(jobRepository, jobDetailRepository);
        }

        @Test
        @DisplayName("quantity > 100 — ném RuntimeException")
        void create_quantityOver100_throwsRuntimeException() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.create(buildRequestDirect(101, 100)));
            assertEquals("Quantity must be between 1 and 100!", ex.getMessage());
        }

        @Test
        @DisplayName("maxCv < 50 — ném RuntimeException trước khi lưu")
        void create_maxCvBelow50_throwsRuntimeException() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.create(buildRequestDirect(3, 49)));
            assertEquals("Quantity applied CV must be greater and equal than 50!", ex.getMessage());
            verifyNoInteractions(jobRepository);
        }

        @Test
        @DisplayName("end trước (now - 1 ngày) — ném RuntimeException")
        void create_endBeforeNowMinusOneDay_throwsRuntimeException() {
            // Guard: end.isBefore(now - 1 ngày) → throw
            // Trigger: end = now - 2 ngày  <  now - 1 ngày  → throw
            CreateJobRequest req = buildRequestDirect(3, 100);
            req.setClosedTime(OffsetDateTime.now().minusDays(2));
            stubDirectLookup();
            stubJobDetailSave();

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.create(req));
            assertEquals("End date must be at least 1 day after now", ex.getMessage());
        }

        @Test
        @DisplayName("end sau (now - 1 ngày) — pass guard 1, không throw")
        void create_endAfterNowMinusOneDay_passesGuard1() {
            // end = now+30  >  now-1ngày → guard 1 pass
            // start = now-1 < (now+30)-1ngày = now+29 → guard 2 pass
            CreateJobRequest req = buildRequestDirect(3, 100);
            req.setClosedTime(OffsetDateTime.now().plusDays(30));
            req.setPostedTime(OffsetDateTime.now().minusDays(1));
            stubDirectLookup();
            stubJobDetailSave();
            stubJobSave();

            assertDoesNotThrow(() -> jobService.create(req));
        }

        @Test
        @DisplayName("start >= (end - 1 ngày) — ném RuntimeException")
        void create_startNotBeforeEndMinusOneDay_throwsRuntimeException() {
            // Guard: !start.isBefore(end - 1 ngày) → throw
            // Trigger: end = now+30, end-1 = now+29, start = now+29 (bằng → không trước) → throw
            CreateJobRequest req = buildRequestDirect(3, 100);
            req.setClosedTime(OffsetDateTime.now().plusDays(30));
            req.setPostedTime(OffsetDateTime.now().plusDays(29));
            stubDirectLookup();
            stubJobDetailSave();

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.create(req));
            assertEquals("Start date must be at least 1 day before end date", ex.getMessage());
        }

        @Test
        @DisplayName("start < (end - 1 ngày) — pass guard 2, không throw")
        void create_startBeforeEndMinusOneDay_passesGuard2() {
            // end = now+30, end-1 = now+29, start = now+28 < now+29 → pass
            CreateJobRequest req = buildRequestDirect(3, 100);
            req.setClosedTime(OffsetDateTime.now().plusDays(30));
            req.setPostedTime(OffsetDateTime.now().plusDays(28));
            stubDirectLookup();
            stubJobDetailSave();
            stubJobSave();

            assertDoesNotThrow(() -> jobService.create(req));
        }

        @Test
        @DisplayName("JobRequest không tồn tại — ném RuntimeException")
        void create_jobRequestNotFound_throwsRuntimeException() {
            stubJobDetailSave();
            when(jobRequestRepository.findById(jobRequestId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.create(buildRequestViaJobRequest(3, 100)));
            assertEquals("Job Request not found", ex.getMessage());
        }

        @Test
        @DisplayName("Employee không tồn tại (direct) — ném RuntimeException")
        void create_employeeNotFound_throwsRuntimeException() {
            stubJobDetailSave();
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.create(buildRequestDirect(3, 100)));
            assertEquals("Employee not found", ex.getMessage());
        }

        @Test
        @DisplayName("Position không tồn tại (direct) — ném RuntimeException")
        void create_positionNotFound_throwsRuntimeException() {
            stubJobDetailSave();
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
            when(positionRepository.findById(posId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.create(buildRequestDirect(3, 100)));
            assertEquals("Position not found", ex.getMessage());
        }
    }

    // ====================================================================
    // getAllJob()
    // ====================================================================
    @Nested
    @DisplayName("getAllJob()")
    class GetAllJob {

        @Test
        @DisplayName("Trả về job không phải DRAFT, sort desc postedAt")
        void getAllJob_returnsNonDraftJobs() {
            when(jobRepository.findByStatusIsNotOrderByPostedAtDesc(JobStatus.DRAFT))
                    .thenReturn(List.of(job));

            List<JobResponse> result = jobService.getAllJob();

            assertEquals(1, result.size());
            verify(jobRepository).findByStatusIsNotOrderByPostedAtDesc(JobStatus.DRAFT);
        }

        @Test
        @DisplayName("Job có closedAt trước now — tự động set CLOSED")
        void getAllJob_expiredJob_setsStatusClosed() {
            job.setClosedAt(OffsetDateTime.now().minusDays(1)); // đã hết hạn
            job.setStatus(JobStatus.OPEN);
            when(jobRepository.findByStatusIsNotOrderByPostedAtDesc(JobStatus.DRAFT))
                    .thenReturn(List.of(job));

            jobService.getAllJob();

            assertEquals(JobStatus.CLOSED, job.getStatus());
        }

        @Test
        @DisplayName("Job chưa hết hạn — giữ nguyên status")
        void getAllJob_notExpired_keepsStatus() {
            job.setClosedAt(OffsetDateTime.now().plusDays(10));
            job.setStatus(JobStatus.OPEN);
            when(jobRepository.findByStatusIsNotOrderByPostedAtDesc(JobStatus.DRAFT))
                    .thenReturn(List.of(job));

            jobService.getAllJob();

            assertEquals(JobStatus.OPEN, job.getStatus());
        }

        @Test
        @DisplayName("Không có job — trả về danh sách rỗng")
        void getAllJob_empty_returnsEmptyList() {
            when(jobRepository.findByStatusIsNotOrderByPostedAtDesc(any()))
                    .thenReturn(List.of());

            assertTrue(jobService.getAllJob().isEmpty());
        }
    }

    // ====================================================================
    // getJobByEmployeeId()
    // ====================================================================
    @Nested
    @DisplayName("getJobByEmployeeId()")
    class GetJobByEmployeeId {

        @Test
        @DisplayName("DRAFT + postedAt trước now — tự động set OPEN")
        void getJobByEmployeeId_draftAndPostedAtPast_setsOpen() {
            job.setStatus(JobStatus.DRAFT);
            job.setPostedAt(OffsetDateTime.now().minusHours(1)); // đã đến giờ đăng
            when(jobRepository.findByEmployee_EmployeeIdOrderByPostedAtDesc(employeeId))
                    .thenReturn(List.of(job));

            jobService.getJobByEmployeeId(employeeId);

            assertEquals(JobStatus.OPEN, job.getStatus());
        }

        @Test
        @DisplayName("Không phải DRAFT + closedAt trước now — tự động set CLOSED")
        void getJobByEmployeeId_openAndExpired_setsClosed() {
            job.setStatus(JobStatus.OPEN);
            job.setPostedAt(OffsetDateTime.now().minusDays(5));
            job.setClosedAt(OffsetDateTime.now().minusDays(1)); // đã hết hạn
            when(jobRepository.findByEmployee_EmployeeIdOrderByPostedAtDesc(employeeId))
                    .thenReturn(List.of(job));

            jobService.getJobByEmployeeId(employeeId);

            assertEquals(JobStatus.CLOSED, job.getStatus());
        }

        @Test
        @DisplayName("DRAFT + postedAt chưa đến — giữ nguyên DRAFT")
        void getJobByEmployeeId_draftAndFuturePostedAt_keepsDraft() {
            job.setStatus(JobStatus.DRAFT);
            job.setPostedAt(OffsetDateTime.now().plusDays(2)); // chưa đến giờ
            job.setClosedAt(OffsetDateTime.now().plusDays(30));
            when(jobRepository.findByEmployee_EmployeeIdOrderByPostedAtDesc(employeeId))
                    .thenReturn(List.of(job));

            jobService.getJobByEmployeeId(employeeId);

            assertEquals(JobStatus.DRAFT, job.getStatus());
        }

        @Test
        @DisplayName("Không có job — trả về danh sách rỗng")
        void getJobByEmployeeId_empty_returnsEmptyList() {
            when(jobRepository.findByEmployee_EmployeeIdOrderByPostedAtDesc(any()))
                    .thenReturn(List.of());

            assertTrue(jobService.getJobByEmployeeId(employeeId).isEmpty());
        }
    }

    // ====================================================================
    // getJobById()
    // ====================================================================
    @Nested
    @DisplayName("getJobById()")
    class GetJobById {

        @Test
        @DisplayName("Id hợp lệ — trả về response đúng dữ liệu")
        void getJobById_found_returnsResponse() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            JobResponse response = jobService.getJobById(jobId);

            assertNotNull(response);
            assertEquals(jobId, response.getId());
        }

        @Test
        @DisplayName("DRAFT + postedAt trước now — tự động set OPEN")
        void getJobById_draftAndPostedAtPast_setsOpen() {
            job.setStatus(JobStatus.DRAFT);
            job.setPostedAt(OffsetDateTime.now().minusHours(1));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            jobService.getJobById(jobId);

            assertEquals(JobStatus.OPEN, job.getStatus());
        }

        @Test
        @DisplayName("OPEN + closedAt trước now — tự động set CLOSED")
        void getJobById_openAndExpired_setsClosed() {
            job.setStatus(JobStatus.OPEN);
            job.setClosedAt(OffsetDateTime.now().minusDays(1));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            jobService.getJobById(jobId);

            assertEquals(JobStatus.CLOSED, job.getStatus());
        }

        @Test
        @DisplayName("Id không tồn tại — ném RuntimeException chứa id")
        void getJobById_notFound_throwsRuntimeException() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.getJobById(jobId));
            assertTrue(ex.getMessage().contains(jobId.toString()));
        }
    }

    // ====================================================================
    // getJobByStatus()
    // ====================================================================
    @Nested
    @DisplayName("getJobByStatus()")
    class GetJobByStatus {

        @Test
        @DisplayName("count >= maxCv — tự động set FILLED")
        void getJobByStatus_countReachesMaxCv_setsFilled() {
            jobDetail.setMaxCv(100);
            when(jobRepository.findByStatus(JobStatus.OPEN)).thenReturn(List.of(job));
            when(applicationRepository.countByJob_Id(jobId)).thenReturn(100L); // count == maxCv

            jobService.getJobByStatus(JobStatus.OPEN);

            assertEquals(JobStatus.FILLED, job.getStatus());
        }

        @Test
        @DisplayName("count < maxCv — giữ nguyên status")
        void getJobByStatus_countBelowMaxCv_keepsStatus() {
            jobDetail.setMaxCv(100);
            when(jobRepository.findByStatus(JobStatus.OPEN)).thenReturn(List.of(job));
            when(applicationRepository.countByJob_Id(jobId)).thenReturn(50L);

            jobService.getJobByStatus(JobStatus.OPEN);

            assertEquals(JobStatus.OPEN, job.getStatus());
        }

        @Test
        @DisplayName("Không có job — trả về danh sách rỗng")
        void getJobByStatus_empty_returnsEmptyList() {
            when(jobRepository.findByStatus(any())).thenReturn(List.of());

            assertTrue(jobService.getJobByStatus(JobStatus.OPEN).isEmpty());
        }
    }

    // ====================================================================
    // update()
    // ====================================================================
    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Hợp lệ — cập nhật jobDetail + job, trả về response")
        void update_valid_updatesAndReturnsResponse() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
            stubDirectLookup();
            stubJobDetailSave();
            stubJobSave();

            JobResponse response = jobService.update(jobId, buildRequestDirect(5, 80));

            assertNotNull(response);
            verify(jobDetailRepository).save(any(JobDetail.class));
            verify(jobRepository).save(any(Job.class));
        }

        @Test
        @DisplayName("Job không tồn tại — ném RuntimeException chứa id")
        void update_jobNotFound_throwsRuntimeException() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.update(jobId, buildRequestDirect(3, 100)));
            assertTrue(ex.getMessage().contains(jobId.toString()));
        }

        @Test
        @DisplayName("quantity = 0 — ném RuntimeException (từ createJobDetail)")
        void update_invalidQuantity_throwsRuntimeException() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            assertThrows(RuntimeException.class,
                    () -> jobService.update(jobId, buildRequestDirect(0, 100)));
            verify(jobRepository, never()).save(any());
        }

        @Test
        @DisplayName("maxCv < 50 — ném RuntimeException (từ createJobDetail)")
        void update_maxCvTooLow_throwsRuntimeException() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            assertThrows(RuntimeException.class,
                    () -> jobService.update(jobId, buildRequestDirect(3, 10)));
        }
    }

    // ====================================================================
    // updateStatus()
    // ====================================================================
    @Nested
    @DisplayName("updateStatus()")
    class UpdateStatus {

        @Test
        @DisplayName("OPEN → FILLED — cập nhật status thành công")
        void updateStatus_openToFilled_setsStatus() {
            job.setStatus(JobStatus.OPEN);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            JobResponse response = jobService.updateStatus(jobId, JobStatus.FILLED);

            assertNotNull(response);
            assertEquals(JobStatus.FILLED, job.getStatus());
        }

        @Test
        @DisplayName("OPEN → CLOSED — set status và closedAt = now")
        void updateStatus_openToClosed_setsStatusAndClosedAt() {
            job.setStatus(JobStatus.OPEN);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            OffsetDateTime before = OffsetDateTime.now();
            jobService.updateStatus(jobId, JobStatus.CLOSED);
            OffsetDateTime after = OffsetDateTime.now();

            assertEquals(JobStatus.CLOSED, job.getStatus());
            assertNotNull(job.getClosedAt());
            assertTrue(!job.getClosedAt().isBefore(before) && !job.getClosedAt().isAfter(after),
                    "closedAt phải được set gần thời điểm gọi");
        }

        @Test
        @DisplayName("Status đã CLOSED — ném RuntimeException 'Cannot update status of closed job'")
        void updateStatus_alreadyClosed_throwsRuntimeException() {
            job.setStatus(JobStatus.CLOSED);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.updateStatus(jobId, JobStatus.OPEN));
            assertEquals("Cannot update status of closed job", ex.getMessage());
        }

        @Test
        @DisplayName("Job không tồn tại — ném RuntimeException chứa id")
        void updateStatus_jobNotFound_throwsRuntimeException() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.updateStatus(jobId, JobStatus.OPEN));
            assertTrue(ex.getMessage().contains(jobId.toString()));
        }
    }

    // ====================================================================
    // delete()
    // ====================================================================
    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Hợp lệ — xóa jobDetail trước, rồi xóa job")
        void delete_valid_deletesJobDetailThenJob() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
            when(jobDetailRepository.findById(jobDetailId)).thenReturn(Optional.of(jobDetail));

            assertDoesNotThrow(() -> jobService.delete(jobId));

            // jobDetail phải bị xóa trước job
            var order = inOrder(jobDetailRepository, jobRepository);
            order.verify(jobDetailRepository).delete(jobDetail);
            order.verify(jobRepository).delete(job);
        }

        @Test
        @DisplayName("Job không tồn tại — ném RuntimeException, không xóa gì")
        void delete_jobNotFound_throwsAndNeverDeletes() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.delete(jobId));
            assertTrue(ex.getMessage().contains(jobId.toString()));
            verifyNoInteractions(jobDetailRepository);
            verify(jobRepository, never()).delete(any());
        }

        @Test
        @DisplayName("JobDetail không tồn tại — ném RuntimeException")
        void delete_jobDetailNotFound_throwsRuntimeException() {
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
            when(jobDetailRepository.findById(jobDetailId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> jobService.delete(jobId));
            assertTrue(ex.getMessage().contains(jobDetailId.toString()));
            verify(jobRepository, never()).delete(any());
        }
    }
}