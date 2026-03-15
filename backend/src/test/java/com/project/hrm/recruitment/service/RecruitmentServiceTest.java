package com.project.hrm.recruitment.service;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import com.project.hrm.module.recruitment.dto.request.CreateJobRequest;
import com.project.hrm.module.recruitment.dto.request.DateLimitRequest;
import com.project.hrm.module.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.module.recruitment.dto.response.JobResponse;
import com.project.hrm.module.recruitment.entity.*;
import com.project.hrm.module.recruitment.enums.*;
import com.project.hrm.module.recruitment.repository.*;
import com.project.hrm.module.recruitment.service.impl.ApplicationServiceImpl;
import com.project.hrm.module.recruitment.service.impl.JobRequestServiceImpl;
import com.project.hrm.module.recruitment.service.impl.JobServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho recruitment module: JobService, JobRequestService, ApplicationService.
 * Sử dụng Mockito để mock toàn bộ dependencies (không cần DB).
 */
@ExtendWith(MockitoExtension.class)
class RecruitmentServiceTest {

    // =========================================================
    //  Helpers – tạo entities dùng chung
    // =========================================================

    private Department buildDepartment() {
        Department dept = new Department();
        dept.setDeptId(UUID.randomUUID());
        dept.setDeptName("Engineering");
        return dept;
    }

    private Position buildPosition(Department dept) {
        Position pos = new Position();
        pos.setPositionId(UUID.randomUUID());
        pos.setTitle("Backend Developer");
        pos.setDepartment(dept);
        pos.setBaseSalaryMin(BigDecimal.valueOf(10_000_000));
        pos.setBaseSalaryMax(BigDecimal.valueOf(20_000_000));
        return pos;
    }

    private Employee buildEmployee() {
        Employee emp = new Employee();
        emp.setEmployeeId(UUID.randomUUID());
        emp.setFullName("Nguyen Van A");
        return emp;
    }

    private JobDetail buildJobDetail(int quantity, int maxCv) {
        JobDetail jd = new JobDetail();
        jd.setJobDetailId(UUID.randomUUID());
        jd.setQuantity(quantity);
        jd.setMaxCv(maxCv);
        jd.setDescription("Desc");
        jd.setRequirements("Req");
        jd.setResponsibilities("Resp");
        jd.setBenefits("Benefits");
        jd.setLocation("Ha Noi");
        jd.setType(EmploymentType.PROBATION);
        jd.setCreatedAt(OffsetDateTime.now());
        return jd;
    }

    private Job buildJob(Position pos, Employee emp, JobDetail jd, JobStatus status) {
        Job job = new Job();
        job.setId(UUID.randomUUID());
        job.setPos(pos);
        job.setEmployee(emp);
        job.setJobDetail(jd);
        job.setStatus(status);
        job.setPostedAt(OffsetDateTime.now().minusDays(1));
        job.setClosedAt(OffsetDateTime.now().plusDays(30));
        return job;
    }

    // =========================================================
    //  JobServiceImpl tests
    // =========================================================

    @Nested
    @DisplayName("JobServiceImpl")
    class JobServiceTests {

        @Mock private JobRepository jobRepository;
        @Mock private ApplicationRepository applicationRepository;
        @Mock private JobDetailRepository jobDetailRepository;
        @Mock private EmployeeRepository employeeRepository;
        @Mock private PositionRepository positionRepository;
        @Mock private JobRequestRepository jobRequestRepository;

        @InjectMocks private JobServiceImpl jobService;

        private Department dept;
        private Position pos;
        private Employee emp;

        @BeforeEach
        void setup() {
            dept = buildDepartment();
            pos  = buildPosition(dept);
            emp  = buildEmployee();
        }

        // ---------- getAllJob ----------

        @Test
        @DisplayName("getAllJob – bỏ qua DRAFT, tự động đóng job quá hạn")
        void getAllJob_excludesDraftAndClosesExpired() {
            // Arrange
            JobDetail jd = buildJobDetail(5, 50);
            Job openJob   = buildJob(pos, emp, jd, JobStatus.OPEN);
            Job expiredJob = buildJob(pos, emp, jd, JobStatus.OPEN);
            expiredJob.setClosedAt(OffsetDateTime.now().minusDays(1)); // đã quá hạn

            when(jobRepository.findByStatusIsNotOrderByPostedAtDesc(JobStatus.DRAFT))
                    .thenReturn(List.of(openJob, expiredJob));

            // Act
            List<JobResponse> result = jobService.getAllJob();

            // Assert
            assertThat(result).hasSize(2);
            // job đã quá hạn phải được đổi sang CLOSED
            assertThat(expiredJob.getStatus()).isEqualTo(JobStatus.CLOSED);
        }

        @Test
        @DisplayName("getAllJob – trả về danh sách rỗng khi không có job")
        void getAllJob_returnsEmptyList() {
            when(jobRepository.findByStatusIsNotOrderByPostedAtDesc(JobStatus.DRAFT))
                    .thenReturn(Collections.emptyList());

            List<JobResponse> result = jobService.getAllJob();

            assertThat(result).isEmpty();
        }

        // ---------- getJobById ----------

        @Test
        @DisplayName("getJobById – trả về đúng response khi tìm thấy")
        void getJobById_success() {
            JobDetail jd = buildJobDetail(3, 100);
            Job job = buildJob(pos, emp, jd, JobStatus.OPEN);
            UUID id = job.getId();

            when(jobRepository.findById(id)).thenReturn(Optional.of(job));

            JobResponse response = jobService.getJobById(id);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(id);
            assertThat(response.getStatus()).isEqualTo(JobStatus.OPEN);
        }

        @Test
        @DisplayName("getJobById – ném RuntimeException khi không tồn tại")
        void getJobById_notFound_throwsException() {
            UUID id = UUID.randomUUID();
            when(jobRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> jobService.getJobById(id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Job not found with id");
        }

        @Test
        @DisplayName("getJobById – DRAFT job chuyển sang OPEN nếu postedAt đã qua")
        void getJobById_draftBecomesOpen_whenPostedAtPassed() {
            JobDetail jd = buildJobDetail(3, 100);
            Job job = buildJob(pos, emp, jd, JobStatus.DRAFT);
            job.setPostedAt(OffsetDateTime.now().minusHours(1)); // đã đến giờ đăng

            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));

            JobResponse response = jobService.getJobById(job.getId());

            assertThat(response.getStatus()).isEqualTo(JobStatus.OPEN);
        }

        // ---------- getJobByStatus ----------

        @Test
        @DisplayName("getJobByStatus – đánh dấu FILLED khi đủ CV")
        void getJobByStatus_marksFilledWhenMaxCvReached() {
            JobDetail jd = buildJobDetail(5, 50);
            Job job = buildJob(pos, emp, jd, JobStatus.OPEN);
            UUID jobId = job.getId();

            when(jobRepository.findByStatus(JobStatus.OPEN)).thenReturn(List.of(job));
            when(applicationRepository.countByJob_Id(jobId)).thenReturn(50L); // đúng bằng maxCv

            List<JobResponse> result = jobService.getJobByStatus(JobStatus.OPEN);

            assertThat(job.getStatus()).isEqualTo(JobStatus.FILLED);
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("getJobByStatus – giữ OPEN khi chưa đủ CV")
        void getJobByStatus_remainsOpen_whenUnderMaxCv() {
            JobDetail jd = buildJobDetail(5, 50);
            Job job = buildJob(pos, emp, jd, JobStatus.OPEN);

            when(jobRepository.findByStatus(JobStatus.OPEN)).thenReturn(List.of(job));
            when(applicationRepository.countByJob_Id(job.getId())).thenReturn(49L);

            jobService.getJobByStatus(JobStatus.OPEN);

            assertThat(job.getStatus()).isEqualTo(JobStatus.OPEN);
        }

        // ---------- updateStatus ----------

        @Test
        @DisplayName("updateStatus – không thể cập nhật job CLOSED")
        void updateStatus_closedJob_throwsException() {
            JobDetail jd = buildJobDetail(3, 100);
            Job job = buildJob(pos, emp, jd, JobStatus.CLOSED);

            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));

            assertThatThrownBy(() -> jobService.updateStatus(job.getId(), JobStatus.OPEN))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot update status of closed job");
        }

        @Test
        @DisplayName("updateStatus – cập nhật thành CLOSED thì gán closedAt")
        void updateStatus_toClosedSetsClosedAt() {
            JobDetail jd = buildJobDetail(3, 100);
            Job job = buildJob(pos, emp, jd, JobStatus.OPEN);

            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));

            JobResponse response = jobService.updateStatus(job.getId(), JobStatus.CLOSED);

            assertThat(response.getStatus()).isEqualTo(JobStatus.CLOSED);
            assertThat(job.getClosedAt()).isNotNull();
        }

        @Test
        @DisplayName("updateStatus – job không tồn tại ném exception")
        void updateStatus_notFound_throwsException() {
            UUID id = UUID.randomUUID();
            when(jobRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> jobService.updateStatus(id, JobStatus.OPEN))
                    .isInstanceOf(RuntimeException.class);
        }

        // ---------- create (validation) ----------

        @Test
        @DisplayName("create – ném exception khi quantity < 1")
        void create_invalidQuantity_throwsException() {
            CreateJobRequest req = new CreateJobRequest();
            req.setQuantity(0);      // invalid
            req.setMaxCv(50);
            req.setPostedTime(OffsetDateTime.now().minusDays(2));
            req.setClosedTime(OffsetDateTime.now().plusDays(5));
            req.setStatus(JobStatus.OPEN);
            req.setHrId(emp.getEmployeeId());
            req.setPosId(pos.getPositionId());

            assertThatThrownBy(() -> jobService.create(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Quantity must be between 1 and 100");
        }

        @Test
        @DisplayName("create – ném exception khi maxCv < 50")
        void create_maxCvTooLow_throwsException() {
            CreateJobRequest req = new CreateJobRequest();
            req.setQuantity(5);
            req.setMaxCv(10);       // invalid
            req.setPostedTime(OffsetDateTime.now().minusDays(2));
            req.setClosedTime(OffsetDateTime.now().plusDays(5));
            req.setStatus(JobStatus.OPEN);
            req.setHrId(emp.getEmployeeId());
            req.setPosId(pos.getPositionId());

            assertThatThrownBy(() -> jobService.create(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("greater and equal than 50");
        }

        // ---------- delete ----------

        @Test
        @DisplayName("delete – xóa thành công khi tìm thấy")
        void delete_success() {
            JobDetail jd = buildJobDetail(3, 100);
            Job job = buildJob(pos, emp, jd, JobStatus.OPEN);

            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
            when(jobDetailRepository.findById(jd.getJobDetailId())).thenReturn(Optional.of(jd));

            jobService.delete(job.getId());

            verify(jobDetailRepository).delete(jd);
            verify(jobRepository).delete(job);
        }

        @Test
        @DisplayName("delete – ném exception khi không tìm thấy job")
        void delete_notFound_throwsException() {
            UUID id = UUID.randomUUID();
            when(jobRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> jobService.delete(id))
                    .isInstanceOf(RuntimeException.class);
        }

        // ---------- getJobByEmployeeId ----------

        @Test
        @DisplayName("getJobByEmployeeId – job DRAFT chuyển OPEN khi postedAt đã qua")
        void getJobByEmployeeId_draftBecomesOpen() {
            JobDetail jd = buildJobDetail(2, 60);
            Job job = buildJob(pos, emp, jd, JobStatus.DRAFT);
            job.setPostedAt(OffsetDateTime.now().minusHours(2));

            when(jobRepository.findByEmployee_EmployeeIdOrderByPostedAtDesc(emp.getEmployeeId()))
                    .thenReturn(List.of(job));

            List<JobResponse> result = jobService.getJobByEmployeeId(emp.getEmployeeId());

            assertThat(job.getStatus()).isEqualTo(JobStatus.OPEN);
            assertThat(result).hasSize(1);
        }
    }

    // =========================================================
    //  JobRequestServiceImpl tests
    // =========================================================

    @Nested
    @DisplayName("JobRequestServiceImpl")
    class JobRequestServiceTests {

        @Mock private JobRequestRepository jobRequestRepository;
        @Mock private DepartmentRepository departmentRepository;
        @Mock private PositionRepository positionRepository;
        @Mock private EmployeeRepository employeeRepository;

        @InjectMocks private JobRequestServiceImpl jobRequestService;

        private Department dept;
        private Position pos;
        private Employee emp;

        @BeforeEach
        void setup() {
            dept = buildDepartment();
            pos  = buildPosition(dept);
            emp  = buildEmployee();
        }

        private JobRequest buildJobRequest(RequestStatus status) {
            JobRequest jr = new JobRequest();
            jr.setId(UUID.randomUUID());
            jr.setDept(dept);
            jr.setPos(pos);
            jr.setQuantity(3);
            jr.setLocation("Ha Noi");
            jr.setType(EmploymentType.PROBATION);
            jr.setReason("Need more staff");
            jr.setStatus(status);
            jr.setCreatedAt(OffsetDateTime.now());
            return jr;
        }

        // ---------- getAllRequest ----------

        @Test
        @DisplayName("getAllRequest – trả về đầy đủ danh sách")
        void getAllRequest_returnsList() {
            JobRequest jr1 = buildJobRequest(RequestStatus.SUBMITTED);
            JobRequest jr2 = buildJobRequest(RequestStatus.APPROVED);
            when(jobRequestRepository.findAll()).thenReturn(List.of(jr1, jr2));

            List<JobRequestResponse> result = jobRequestService.getAllRequest();

            assertThat(result).hasSize(2);
        }

        // ---------- getRequestById ----------

        @Test
        @DisplayName("getRequestById – trả về response đúng")
        void getRequestById_success() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));

            JobRequestResponse response = jobRequestService.getRequestById(jr.getId());

            assertThat(response.getId()).isEqualTo(jr.getId());
            assertThat(response.getStatus()).isEqualTo(RequestStatus.SUBMITTED);
        }

        @Test
        @DisplayName("getRequestById – ném exception khi không tìm thấy")
        void getRequestById_notFound_throwsException() {
            UUID id = UUID.randomUUID();
            when(jobRequestRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> jobRequestService.getRequestById(id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Job request not found with id");
        }

        // ---------- create (validation) ----------

        @Test
        @DisplayName("create – ném exception khi quantity <= 0")
        void create_zeroQuantity_throwsException() {
            JobRequestRequest req = new JobRequestRequest();
            req.setQuantity(0);   // invalid
            req.setDeptId(dept.getDeptId());
            req.setPosId(pos.getPositionId());
            req.setLocation("Ha Noi");
            req.setReason("Need staff");
            req.setType(EmploymentType.PROBATION);

            assertThatThrownBy(() -> jobRequestService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Quantity must be greater than 0");
        }

        @Test
        @DisplayName("create – tạo thành công với dữ liệu hợp lệ")
        void create_validRequest_success() {
            JobRequestRequest req = new JobRequestRequest();
            req.setDeptId(dept.getDeptId());
            req.setPosId(pos.getPositionId());
            req.setQuantity(3);
            req.setLocation("Ha Noi");
            req.setReason("Need staff");
            req.setType(EmploymentType.PROBATION);

            when(departmentRepository.findById(dept.getDeptId())).thenReturn(Optional.of(dept));
            when(positionRepository.findById(pos.getPositionId())).thenReturn(Optional.of(pos));
            when(jobRequestRepository.save(any())).thenAnswer(inv -> {
                JobRequest jr = inv.getArgument(0);
                jr.setId(UUID.randomUUID());
                return jr;
            });

            JobRequestResponse response = jobRequestService.create(req);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(RequestStatus.SUBMITTED);
            verify(jobRequestRepository).save(any(JobRequest.class));
        }

        // ---------- updateStatus ----------

        @Test
        @DisplayName("updateStatus – APPROVED thành công")
        void updateStatus_approve_success() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));
            when(jobRequestRepository.save(jr)).thenReturn(jr);

            JobRequestResponse response = jobRequestService.updateStatus(
                    jr.getId(), RequestStatus.APPROVED, null);

            assertThat(response.getStatus()).isEqualTo(RequestStatus.APPROVED);
        }

        @Test
        @DisplayName("updateStatus – từ chối không có comment ném exception")
        void updateStatus_rejectWithoutComment_throwsException() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));

            assertThatThrownBy(() -> jobRequestService.updateStatus(
                    jr.getId(), RequestStatus.REJECTED, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Comment is required when rejecting");
        }

        @Test
        @DisplayName("updateStatus – request APPROVED rồi không thể cập nhật lại")
        void updateStatus_alreadyApproved_throwsException() {
            JobRequest jr = buildJobRequest(RequestStatus.APPROVED);
            when(jobRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));

            assertThatThrownBy(() ->
                    jobRequestService.updateStatus(jr.getId(), RequestStatus.REJECTED, "Late"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Request already processed");
        }

        @Test
        @DisplayName("updateStatus – request REJECTED rồi không thể cập nhật lại")
        void updateStatus_alreadyRejected_throwsException() {
            JobRequest jr = buildJobRequest(RequestStatus.REJECTED);
            when(jobRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));

            assertThatThrownBy(() ->
                    jobRequestService.updateStatus(jr.getId(), RequestStatus.APPROVED, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Request already processed");
        }

        @Test
        @DisplayName("updateStatus – REJECT kèm comment lưu comment vào entity")
        void updateStatus_rejectWithComment_savesComment() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));
            when(jobRequestRepository.save(jr)).thenReturn(jr);

            jobRequestService.updateStatus(jr.getId(), RequestStatus.REJECTED, "Chưa đủ budget");

            assertThat(jr.getHrComment()).isEqualTo("Chưa đủ budget");
            assertThat(jr.getStatus()).isEqualTo(RequestStatus.REJECTED);
        }

        // ---------- delete ----------

        @Test
        @DisplayName("delete – xóa thành công")
        void delete_success() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));

            jobRequestService.delete(jr.getId());

            verify(jobRequestRepository).delete(jr);
        }

        @Test
        @DisplayName("delete – ném exception khi không tìm thấy")
        void delete_notFound_throwsException() {
            UUID id = UUID.randomUUID();
            when(jobRequestRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> jobRequestService.delete(id))
                    .isInstanceOf(RuntimeException.class);
        }

        // ---------- getRequestByHr ----------

        @Test
        @DisplayName("getRequestByHr – trả về danh sách SUBMITTED không có reportsTo")
        void getRequestByHr_returnsList() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findByStatusAndReportsToIsNull(RequestStatus.SUBMITTED))
                    .thenReturn(List.of(jr));

            List<JobRequestResponse> result = jobRequestService.getRequestByHr();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("getRequestByHr – trả về rỗng khi không có request")
        void getRequestByHr_empty() {
            when(jobRequestRepository.findByStatusAndReportsToIsNull(RequestStatus.SUBMITTED))
                    .thenReturn(Collections.emptyList());

            List<JobRequestResponse> result = jobRequestService.getRequestByHr();

            assertThat(result).isEmpty();
        }

        // ---------- choiceHr ----------

        @Test
        @DisplayName("choiceHr – gán reportsTo cho từng JobRequest")
        void choiceHr_assignsEmployee() {
            JobRequest jr1 = buildJobRequest(RequestStatus.SUBMITTED);
            JobRequest jr2 = buildJobRequest(RequestStatus.SUBMITTED);
            List<UUID> ids = List.of(jr1.getId(), jr2.getId());

            when(jobRequestRepository.findAllById(ids)).thenReturn(List.of(jr1, jr2));
            when(employeeRepository.findById(emp.getEmployeeId())).thenReturn(Optional.of(emp));

            List<JobRequestResponse> result = jobRequestService.choiceHr(emp.getEmployeeId(), ids);

            assertThat(jr1.getReportsTo()).isEqualTo(emp);
            assertThat(jr2.getReportsTo()).isEqualTo(emp);
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("choiceHr – ném exception khi employee không tìm thấy")
        void choiceHr_employeeNotFound_throwsException() {
            UUID unknownId = UUID.randomUUID();
            when(jobRequestRepository.findAllById(any())).thenReturn(Collections.emptyList());
            when(employeeRepository.findById(unknownId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> jobRequestService.choiceHr(unknownId, List.of(UUID.randomUUID())))
                    .isInstanceOf(RuntimeException.class);
        }

        // ---------- update ----------

        @Test
        @DisplayName("update – cập nhật request thành công")
        void update_success() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);

            JobRequestRequest req = new JobRequestRequest();
            req.setQuantity(5);
            req.setLocation("Ho Chi Minh");
            req.setReason("Expand team");
            req.setType(EmploymentType.PROBATION);
            req.setDeptId(dept.getDeptId());
            req.setPosId(pos.getPositionId());

            when(jobRequestRepository.findById(jr.getId())).thenReturn(Optional.of(jr));
            when(departmentRepository.findById(dept.getDeptId())).thenReturn(Optional.of(dept));
            when(positionRepository.findById(pos.getPositionId())).thenReturn(Optional.of(pos));
            when(jobRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            JobRequestResponse response = jobRequestService.update(jr.getId(), req);

            assertThat(response.getQuantity()).isEqualTo(5);
            assertThat(response.getLocation()).isEqualTo("Ho Chi Minh");
        }

        // ---------- getRequestByDepartmentName ----------

        @Test
        @DisplayName("getRequestByDepartmentName – trả về danh sách theo tên phòng ban và trạng thái")
        void getRequestByDepartmentName_returnsList() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findByDept_DeptNameAndStatus(
                    eq("Engineering"), eq(RequestStatus.SUBMITTED), any(Sort.class)))
                    .thenReturn(List.of(jr));

            List<JobRequestResponse> result =
                    jobRequestService.getRequestByDepartmentName("Engineering", RequestStatus.SUBMITTED);

            assertThat(result).hasSize(1);
        }

        // ---------- getRequestByReportTo ----------

        @Test
        @DisplayName("getRequestByReportTo – trả về danh sách theo HR và trạng thái")
        void getRequestByReportTo_returnsList() {
            JobRequest jr = buildJobRequest(RequestStatus.SUBMITTED);
            when(jobRequestRepository.findByReportsTo_EmployeeIdAndStatus(
                    eq(emp.getEmployeeId()), eq(RequestStatus.SUBMITTED), any(Sort.class)))
                    .thenReturn(List.of(jr));

            List<JobRequestResponse> result =
                    jobRequestService.getRequestByReportTo(emp.getEmployeeId(), RequestStatus.SUBMITTED);

            assertThat(result).hasSize(1);
        }
    }

    // =========================================================
    //  ApplicationServiceImpl tests
    // =========================================================

    @Nested
    @DisplayName("ApplicationServiceImpl")
    class ApplicationServiceTests {

        @Mock private com.project.hrm.module.recruitment.repository.CandidateRepository candidateRepository;
        @Mock private JobRepository jobRepository;
        @Mock private com.project.hrm.module.recruitment.service.email.UploadCV uploadCV;
        @Mock private com.project.hrm.module.recruitment.service.email.ExpectedInterview expectedInterview;
        @Mock private ApplicationRepository applicationRepository;
        @Mock private com.project.hrm.module.recruitment.service.CvReviewService cvReviewService;
        @Mock private com.project.hrm.module.recruitment.service.InterviewService interviewService;
        @Mock private com.project.hrm.module.recruitment.service.FileService fileService;
        @Mock private com.project.hrm.module.recruitment.service.email.OfferEmail offerEmail;
        @Mock private com.project.hrm.module.recruitment.service.email.RejectEmail rejectEmail;

        @InjectMocks private ApplicationServiceImpl applicationService;

        private Department dept;
        private Position pos;
        private Employee emp;
        private Job job;

        @BeforeEach
        void setup() {
            dept = buildDepartment();
            pos  = buildPosition(dept);
            emp  = buildEmployee();
            JobDetail jd = buildJobDetail(3, 100);
            job = buildJob(pos, emp, jd, JobStatus.OPEN);
        }

        private Candidate buildCandidate(String email) {
            Candidate c = new Candidate();
            c.setId(UUID.randomUUID());
            c.setEmail(email);
            c.setFullName("Tran Thi B");
            c.setPhone("0123456789");
            return c;
        }

        private Application buildApplication(Candidate candidate, Job j, ApplicationStatus status) {
            Application app = new Application();
            app.setId(UUID.randomUUID());
            app.setCandidate(candidate);
            app.setJob(j);
            app.setCvUrl("cv/test.pdf");
            app.setStatus(status);
            app.setCreatedAt(OffsetDateTime.now());
            return app;
        }

        // ---------- getApplicationById ----------

        @Test
        @DisplayName("getApplicationById – trả về đúng response")
        void getApplicationById_success() {
            Candidate candidate = buildCandidate("test@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.APPLIED);

            when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

            ApplicationResponse response = applicationService.getApplicationById(app.getId());

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(app.getId());
            assertThat(response.getStatus()).isEqualTo(ApplicationStatus.APPLIED);
            assertThat(response.getEmail()).isEqualTo("test@mail.com");
        }

        @Test
        @DisplayName("getApplicationById – ném exception khi không tìm thấy")
        void getApplicationById_notFound_throwsException() {
            UUID id = UUID.randomUUID();
            when(applicationRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> applicationService.getApplicationById(id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Application not found");
        }

        // ---------- setDateLimit ----------

        @Test
        @DisplayName("setDateLimit – ném exception khi start trong quá khứ hơn 1 ngày")
        void setDateLimit_startTooEarly_throwsException() {
            Candidate candidate = buildCandidate("c@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.APPLIED);

            DateLimitRequest req = new DateLimitRequest();
            req.setId(app.getId());
            req.setStart(OffsetDateTime.now().minusDays(2)); // quá 1 ngày trong quá khứ
            req.setEnd(OffsetDateTime.now().plusDays(10));

            when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

            assertThatThrownBy(() -> applicationService.setDateLimit(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Start date must be at least a day before now");
        }

        @Test
        @DisplayName("setDateLimit – ném exception khi khoảng cách start-end < 1 tuần")
        void setDateLimit_rangeUnderOneWeek_throwsException() {
            Candidate candidate = buildCandidate("c@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.APPLIED);

            DateLimitRequest req = new DateLimitRequest();
            req.setId(app.getId());
            req.setStart(OffsetDateTime.now().plusDays(1));
            req.setEnd(OffsetDateTime.now().plusDays(3)); // chỉ 2 ngày, cần >= 7

            when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

            assertThatThrownBy(() -> applicationService.setDateLimit(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Start date must be at least a week before end date");
        }

        @Test
        @DisplayName("setDateLimit – thành công với ngày hợp lệ, chuyển status INTERVIEW")
        void setDateLimit_valid_changesStatusToInterview() {
            Candidate candidate = buildCandidate("c@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.APPLIED);

            DateLimitRequest req = new DateLimitRequest();
            req.setId(app.getId());
            req.setStart(OffsetDateTime.now().plusDays(1));
            req.setEnd(OffsetDateTime.now().plusDays(10));

            when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
            when(applicationRepository.save(app)).thenReturn(app);
            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
            doNothing().when(expectedInterview).sendEmail(any());

            ApplicationResponse response = applicationService.setDateLimit(req);

            assertThat(response.getStatus()).isEqualTo(ApplicationStatus.INTERVIEW);
            verify(expectedInterview).sendEmail(any());
        }

        // ---------- nextStage ----------

        @Test
        @DisplayName("nextStage – ném exception khi danh sách ids rỗng")
        void nextStage_emptyIds_throwsException() {
            assertThatThrownBy(() -> applicationService.nextStage(Collections.emptyList()))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("No list to next status");
        }

        @Test
        @DisplayName("nextStage – ném exception khi ids là null")
        void nextStage_nullIds_throwsException() {
            assertThatThrownBy(() -> applicationService.nextStage(null))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("nextStage – ném exception khi application chưa có score")
        void nextStage_applicationWithoutScore_throwsException() {
            Candidate candidate = buildCandidate("c@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.INTERVIEW);
            app.setScore(null); // chưa chấm điểm

            when(applicationRepository.findAllById(anyList())).thenReturn(List.of(app));

            assertThatThrownBy(() -> applicationService.nextStage(List.of(app.getId())))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("hasn't score");
        }

        @Test
        @DisplayName("nextStage – chuyển status thành OFFER và gửi email")
        void nextStage_valid_changesStatusToOffer() {
            Candidate candidate = buildCandidate("c@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.INTERVIEW);
            app.setScore(BigDecimal.valueOf(8.5));

            when(applicationRepository.findAllById(anyList())).thenReturn(List.of(app));
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of(app));
            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
            doNothing().when(offerEmail).sendEmail(any());

            List<ApplicationResponse> result = applicationService.nextStage(List.of(app.getId()));

            assertThat(app.getStatus()).isEqualTo(ApplicationStatus.OFFER);
            assertThat(result).hasSize(1);
            verify(offerEmail).sendEmail(any());
        }

        // ---------- lastStage ----------

        @Test
        @DisplayName("lastStage – ném exception khi đã đủ số lượng HIRED")
        void lastStage_fullQuantity_throwsException() {
            Candidate candidate = buildCandidate("c@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.OFFER);

            when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
            // Đã hired đủ 3 người (bằng quantity)
            when(applicationRepository.countByJob_IdAndStatus(job.getId(), ApplicationStatus.HIRED))
                    .thenReturn(3L);

            assertThatThrownBy(() -> applicationService.lastStage(app.getId()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Have full quantity in position");
        }

        @Test
        @DisplayName("lastStage – chuyển OFFER sang HIRED thành công")
        void lastStage_offer_hiresCandidate() {
            Candidate candidate = buildCandidate("c@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.OFFER);

            when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
            when(applicationRepository.countByJob_IdAndStatus(job.getId(), ApplicationStatus.HIRED))
                    .thenReturn(1L); // còn chỗ (quantity=3)
            when(applicationRepository.save(app)).thenReturn(app);

            ApplicationResponse response = applicationService.lastStage(app.getId());

            assertThat(app.getStatus()).isEqualTo(ApplicationStatus.HIRED);
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("lastStage – khi hired đủ quantity, reject các ứng viên còn lại và đóng job")
        void lastStage_fillsLastSlot_closesJobAndRejectsOthers() {
            Candidate hired = buildCandidate("hired@mail.com");
            Application appToHire = buildApplication(hired, job, ApplicationStatus.OFFER);
            appToHire.setScore(BigDecimal.TEN);

            Candidate other = buildCandidate("other@mail.com");
            Application otherApp = buildApplication(other, job, ApplicationStatus.INTERVIEW);

            when(applicationRepository.findById(appToHire.getId())).thenReturn(Optional.of(appToHire));
            when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
            // hired count = 2, quantity = 3, sau khi hire này sẽ đủ 3
            when(applicationRepository.countByJob_IdAndStatus(job.getId(), ApplicationStatus.HIRED))
                    .thenReturn(2L);
            when(applicationRepository.save(appToHire)).thenReturn(appToHire);
            when(applicationRepository.findByJob_IdAndStatusIsNot(
                    job.getId(), ApplicationStatus.HIRED))
                    .thenReturn(List.of(otherApp));
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of(otherApp));
            doNothing().when(rejectEmail).sendEmail(any());

            applicationService.lastStage(appToHire.getId());

            assertThat(appToHire.getStatus()).isEqualTo(ApplicationStatus.HIRED);
            assertThat(otherApp.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
            assertThat(job.getStatus()).isEqualTo(JobStatus.CLOSED);
            verify(rejectEmail).sendEmail(any());
        }

        // ---------- getAppByJobIdAndStatus ----------

        @Test
        @DisplayName("getAppByJobIdAndStatus – trả về danh sách đúng")
        void getAppByJobIdAndStatus_returnsList() {
            Candidate candidate = buildCandidate("c@mail.com");
            Application app = buildApplication(candidate, job, ApplicationStatus.APPLIED);

            when(applicationRepository.findByJob_IdAndStatus(
                    eq(job.getId()), eq(ApplicationStatus.APPLIED), any(Sort.class)))
                    .thenReturn(List.of(app));

            List<ApplicationResponse> result =
                    applicationService.getAppByJobIdAndStatus(job.getId(), ApplicationStatus.APPLIED);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(ApplicationStatus.APPLIED);
        }

        @Test
        @DisplayName("getAppByJobIdAndStatus – trả về rỗng khi không có ứng viên")
        void getAppByJobIdAndStatus_empty() {
            when(applicationRepository.findByJob_IdAndStatus(
                    eq(job.getId()), eq(ApplicationStatus.APPLIED), any(Sort.class)))
                    .thenReturn(Collections.emptyList());

            List<ApplicationResponse> result =
                    applicationService.getAppByJobIdAndStatus(job.getId(), ApplicationStatus.APPLIED);

            assertThat(result).isEmpty();
        }
    }
}
