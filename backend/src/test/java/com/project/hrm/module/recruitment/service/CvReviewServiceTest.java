package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.recruitment.dto.request.CvReviewRequest;
import com.project.hrm.module.recruitment.dto.response.CvReviewResponse;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.CvReview;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.entity.Candidate;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.enums.ResultStatus;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import com.project.hrm.module.recruitment.repository.CvReviewRepository;
import com.project.hrm.module.recruitment.repository.JobRepository;
import com.project.hrm.module.recruitment.service.email.RejectEmail;
import com.project.hrm.module.recruitment.service.impl.CvReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CvReviewServiceImpl — Unit Tests")
class CvReviewServiceTest {

    // ─────────────────────────────── mocks ────────────────────────────────
    @Mock private ApplicationRepository applicationRepository;
    @Mock private CvReviewRepository    cvReviewRepository;
    @Mock private EmployeeRepository    employeeRepository;
    @Mock private JobRepository         jobRepository;
    @Mock private RejectEmail           rejectEmail;

    @InjectMocks
    private CvReviewServiceImpl cvReviewService;

    // ─────────────────────────────── fixtures ─────────────────────────────
    private UUID appId;
    private UUID reviewerId;
    private UUID jobId;

    private Application application;
    private Employee    reviewer;
    private Job         job;
    private CvReview    cvReview;

    @BeforeEach
    void setUp() {
        appId      = UUID.randomUUID();
        reviewerId = UUID.randomUUID();
        jobId      = UUID.randomUUID();

        // Position
        Position pos = new Position();
        pos.setTitle("Backend Engineer");

        // HR Employee (on Job)
        Employee hrEmployee = new Employee();
        hrEmployee.setFullName("HR Manager");

        // Job
        job = new Job();
        job.setId(jobId);
        job.setPos(pos);
        job.setEmployee(hrEmployee);

        // Candidate
        Candidate candidate = new Candidate();
        candidate.setId(UUID.randomUUID());
        candidate.setFullName("Nguyen Van A");
        candidate.setEmail("candidate@example.com");
        candidate.setPhone("0901234567");

        // Application
        application = new Application();
        application.setId(appId);
        application.setJob(job);
        application.setCandidate(candidate);
        application.setStatus(ApplicationStatus.APPLIED);

        // Reviewer (Employee)
        reviewer = new Employee();
        reviewer.setEmployeeId(reviewerId);
        reviewer.setFullName("Reviewer Name");

        // CvReview entity
        cvReview = new CvReview();
        cvReview.setId(UUID.randomUUID());
        cvReview.setApp(application);
        cvReview.setReviewer(reviewer);
        cvReview.setComment("Good candidate");
        cvReview.setResult(ResultStatus.PASSED);
    }

    // ====================================================================
    // create()
    // ====================================================================
    @Nested
    @DisplayName("create()")
    class Create {

        private CvReviewRequest buildRequest(ResultStatus result) {
            CvReviewRequest req = new CvReviewRequest();
            req.setAppId(appId);
            req.setReviewerId(reviewerId);
            req.setComment("Good candidate");
            req.setResult(result);
            return req;
        }

        @Test
        @DisplayName("Review PASSED — lưu entity, không gửi email reject")
        void create_resultPassed_savesAndNoRejectEmail() {
            when(cvReviewRepository.existsByApp_Id(appId)).thenReturn(false);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(employeeRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
            when(cvReviewRepository.save(any(CvReview.class))).thenReturn(cvReview);

            CvReviewResponse response = cvReviewService.create(buildRequest(ResultStatus.PASSED));

            assertNotNull(response);
            verify(cvReviewRepository).save(any(CvReview.class));
            verify(rejectEmail, never()).sendEmail(any());   // PASSED → không reject
        }

        @Test
        @DisplayName("Review FAILED — chuyển status REJECTED, gửi email reject")
        void create_resultFailed_setsRejectedStatusAndSendsEmail() {
            CvReview failedReview = new CvReview();
            failedReview.setId(UUID.randomUUID());
            failedReview.setApp(application);
            failedReview.setReviewer(reviewer);
            failedReview.setComment("Not qualified");
            failedReview.setResult(ResultStatus.FAILED);

            when(cvReviewRepository.existsByApp_Id(appId)).thenReturn(false);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(employeeRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
            when(cvReviewRepository.save(any(CvReview.class))).thenReturn(failedReview);

            cvReviewService.create(buildRequest(ResultStatus.FAILED));

            // Application phải bị set REJECTED
            assertEquals(ApplicationStatus.REJECTED, application.getStatus());
            // Phải gửi email reject đúng 1 lần
            verify(rejectEmail, times(1)).sendEmail(any());
        }

        @Test
        @DisplayName("Review FAILED — email reject chứa đúng thông tin ứng viên")
        void create_resultFailed_emailRequestHasCorrectCandidateInfo() {
            when(cvReviewRepository.existsByApp_Id(appId)).thenReturn(false);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(employeeRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
            when(cvReviewRepository.save(any(CvReview.class))).thenAnswer(inv -> {
                CvReview r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            cvReviewService.create(buildRequest(ResultStatus.FAILED));

            var captor = ArgumentCaptor.forClass(
                    com.project.hrm.module.recruitment.dto.request.EmailRequest.class);
            verify(rejectEmail).sendEmail(captor.capture());

            var emailRequest = captor.getValue();
            assertEquals("Backend Engineer",       emailRequest.getTitle());
            assertEquals("Nguyen Van A",           emailRequest.getCandidateName());
            assertEquals("candidate@example.com",  emailRequest.getCanEmail());
            assertEquals("HR Manager",             emailRequest.getHrName());
        }

        @Test
        @DisplayName("Đã tồn tại review cho application — ném RuntimeException")
        void create_reviewAlreadyExists_throwsRuntimeException() {
            when(cvReviewRepository.existsByApp_Id(appId)).thenReturn(true);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> cvReviewService.create(buildRequest(ResultStatus.PASSED)));
            assertEquals("Review CV has done!", ex.getMessage());

            // Không được lưu gì thêm
            verify(cvReviewRepository, never()).save(any());
            verify(applicationRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Application không tồn tại — ném RuntimeException")
        void create_applicationNotFound_throwsRuntimeException() {
            when(cvReviewRepository.existsByApp_Id(appId)).thenReturn(false);
            when(applicationRepository.findById(appId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> cvReviewService.create(buildRequest(ResultStatus.PASSED)));
            assertEquals("Not found application!", ex.getMessage());
        }

        @Test
        @DisplayName("Reviewer (Employee) không tồn tại — ném RuntimeException")
        void create_reviewerNotFound_throwsRuntimeException() {
            when(cvReviewRepository.existsByApp_Id(appId)).thenReturn(false);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(employeeRepository.findById(reviewerId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> cvReviewService.create(buildRequest(ResultStatus.PASSED)));
            assertEquals("Reviewer not found!", ex.getMessage());
        }

        @Test
        @DisplayName("FAILED nhưng Job không tồn tại — ném RuntimeException")
        void create_resultFailed_jobNotFound_throwsRuntimeException() {
            when(cvReviewRepository.existsByApp_Id(appId)).thenReturn(false);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(employeeRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
            when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> cvReviewService.create(buildRequest(ResultStatus.FAILED)));
            assertEquals("Not found job", ex.getMessage());
        }

        @Test
        @DisplayName("Comment và result được lưu đúng vào entity")
        void create_savesCommentAndResultCorrectly() {
            when(cvReviewRepository.existsByApp_Id(appId)).thenReturn(false);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(employeeRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
            when(cvReviewRepository.save(any(CvReview.class))).thenAnswer(inv -> {
                CvReview r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            cvReviewService.create(buildRequest(ResultStatus.PASSED));

            var captor = ArgumentCaptor.forClass(CvReview.class);
            verify(cvReviewRepository).save(captor.capture());

            CvReview saved = captor.getValue();
            assertEquals("Good candidate",    saved.getComment());
            assertEquals(ResultStatus.PASSED, saved.getResult());
            assertEquals(appId, saved.getApp().getId());
            assertEquals(reviewerId, saved.getReviewer().getEmployeeId());
        }
    }

    // ====================================================================
    // getReviewById()
    // ====================================================================
    @Nested
    @DisplayName("getReviewById()")
    class GetReviewById {

        @Test
        @DisplayName("Id hợp lệ — trả về CvReviewResponse đúng dữ liệu")
        void getReviewById_found_returnsResponse() {
            when(cvReviewRepository.findByApp_Id(appId)).thenReturn(cvReview);

            CvReviewResponse response = cvReviewService.getReviewById(appId);

            assertNotNull(response);
            assertEquals(cvReview.getId(),                    response.getId());
            assertEquals(appId,                               response.getAppId());
            assertEquals(reviewerId,                          response.getReviewerId());
            assertEquals(reviewer.getFullName(),              response.getReviewerName());
            assertEquals(cvReview.getComment(),               response.getComment());
            assertEquals(ResultStatus.PASSED,                 response.getResult());
        }

        @Test
        @DisplayName("Repository trả về null — ném NullPointerException (mapToResponse không guard null)")
        void getReviewById_notFound_throwsNullPointerException() {
            when(cvReviewRepository.findByApp_Id(any())).thenReturn(null);

            // mapToResponse() sẽ NPE vì entity.getId() trên null
            assertThrows(NullPointerException.class,
                    () -> cvReviewService.getReviewById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Gọi đúng repository method với đúng appId")
        void getReviewById_callsRepositoryWithCorrectId() {
            when(cvReviewRepository.findByApp_Id(appId)).thenReturn(cvReview);

            cvReviewService.getReviewById(appId);

            verify(cvReviewRepository).findByApp_Id(appId);
        }
    }

    // ====================================================================
    // deleteReview()
    // ====================================================================
    @Nested
    @DisplayName("deleteReview()")
    class DeleteReview {

        @Test
        @DisplayName("Xóa review theo appId — gọi đúng repository")
        void deleteReview_validAppId_callsRepository() {
            doNothing().when(cvReviewRepository).deleteByApp_Id(appId);

            assertDoesNotThrow(() -> cvReviewService.deleteReview(appId));

            verify(cvReviewRepository, times(1)).deleteByApp_Id(appId);
        }

        @Test
        @DisplayName("Truyền đúng appId xuống repository")
        void deleteReview_passesCorrectIdToRepository() {
            UUID specificId = UUID.randomUUID();
            doNothing().when(cvReviewRepository).deleteByApp_Id(specificId);

            cvReviewService.deleteReview(specificId);

            verify(cvReviewRepository).deleteByApp_Id(specificId);
            verify(cvReviewRepository, never()).deleteByApp_Id(appId); // không nhầm id khác
        }

        @Test
        @DisplayName("Không tìm thấy review — không ném exception (delegate cho repository)")
        void deleteReview_noReviewExists_noException() {
            // Spring Data tự xử lý khi không có record, không ném exception
            doNothing().when(cvReviewRepository).deleteByApp_Id(any());

            assertDoesNotThrow(() -> cvReviewService.deleteReview(UUID.randomUUID()));
        }
    }
}