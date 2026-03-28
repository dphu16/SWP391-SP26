package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.recruitment.dto.request.InterviewRequest;
import com.project.hrm.module.recruitment.dto.response.InterviewResponse;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Candidate;
import com.project.hrm.module.recruitment.entity.Interview;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.entity.Role;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.enums.InterviewStatus;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import com.project.hrm.module.recruitment.repository.InterviewRepository;
import com.project.hrm.module.recruitment.repository.JobRepository;
import com.project.hrm.module.recruitment.service.email.RealInterview;
import com.project.hrm.module.recruitment.service.impl.InterviewServiceImpl;
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
@DisplayName("InterviewServiceImpl — Unit Tests")
class InterviewServiceTest {

    // ─────────────────────────────── mocks ────────────────────────────────
    @Mock private ApplicationRepository applicationRepository;
    @Mock private InterviewRepository   interviewRepository;
    @Mock private EmployeeRepository    employeeRepository;
    @Mock private DepartmentRepository  departmentRepository;
    @Mock private JobRepository         jobRepository;
    @Mock private RealInterview         realInterview;

    @InjectMocks
    private InterviewServiceImpl interviewService;

    // ─────────────────────────────── fixtures ─────────────────────────────
    private UUID appId;
    private UUID interviewId;
    private UUID interviewerId;
    private UUID jobId;
    private UUID deptId;

    private Application application;
    private Interview   interview;
    private Employee    interviewer;
    private Job         job;
    private Department  department;

    // Thời gian mặc định: start hôm nay, end +7 ngày, scheduleTime +3 ngày (nằm trong range)
    private OffsetDateTime start;
    private OffsetDateTime end;
    private OffsetDateTime validScheduleTime;

    @BeforeEach
    void setUp() {
        appId       = UUID.randomUUID();
        interviewId = UUID.randomUUID();
        interviewerId = UUID.randomUUID();
        jobId       = UUID.randomUUID();
        deptId      = UUID.randomUUID();

        start             = OffsetDateTime.now();
        end               = OffsetDateTime.now().plusDays(7);
        validScheduleTime = OffsetDateTime.now().plusDays(3);

        // Position & Job
        Position pos = new Position();
        pos.setTitle("Backend Engineer");

        Employee hrEmployee = new Employee();
        hrEmployee.setFullName("HR Manager");

        job = new Job();
        job.setId(jobId);
        job.setPos(pos);
        job.setEmployee(hrEmployee);

        // Candidate & Application
        Candidate candidate = new Candidate();
        candidate.setId(UUID.randomUUID());
        candidate.setFullName("Nguyen Van A");
        candidate.setEmail("candidate@example.com");

        application = new Application();
        application.setId(appId);
        application.setJob(job);
        application.setCandidate(candidate);
        application.setStatus(ApplicationStatus.INTERVIEW);
        application.setStart(start);
        application.setEnd(end);

        // User & Interviewer (HR role)
        User hrUser = new User();
        Role hrRole = new Role();
        hrRole.setName(EmployeeRole.ROLE_HR);
        hrUser.setRoles(java.util.Set.of(hrRole));

        interviewer = new Employee();
        interviewer.setEmployeeId(interviewerId);
        interviewer.setFullName("Interviewer Name");
        interviewer.setUser(hrUser);

        // Interview entity
        interview = new Interview();
        interview.setId(interviewId);
        interview.setApp(application);
        interview.setInterviewer(interviewer);
        interview.setScheduleTime(validScheduleTime);
        interview.setStatus(InterviewStatus.SCHEDULED);

        // Department với manager
        Employee manager = new Employee();
        manager.setEmployeeId(UUID.randomUUID());
        manager.setFullName("Department Manager");
        User managerUser = new User();
        Role managerRole = new Role();
        managerRole.setName(EmployeeRole.ROLE_MANAGER);
        managerUser.setRoles(java.util.Set.of(managerRole));
        manager.setUser(managerUser);

        department = new Department();
        department.setDeptId(deptId);
        department.setManager(manager);
    }

    // Helper tạo request
    private InterviewRequest buildScheduleRequest(OffsetDateTime scheduleTime) {
        InterviewRequest req = new InterviewRequest();
        req.setAppId(appId);
        req.setInterviewerId(interviewerId);
        req.setScheduleTime(scheduleTime);
        return req;
    }

    private InterviewRequest buildResultRequest(InterviewStatus status, BigDecimal score, String feedback) {
        InterviewRequest req = new InterviewRequest();
        req.setInterviewerId(interviewerId);
        req.setStatus(status);
        req.setScore(score);
        req.setFeedback(feedback);
        return req;
    }

    // ====================================================================
    // createSchedule()
    // ====================================================================
    @Nested
    @DisplayName("createSchedule()")
    class CreateSchedule {

        @Test
        @DisplayName("Interview chưa tồn tại — tạo mới, lưu, gửi email")
        void createSchedule_newInterview_savesAndSendsEmail() {
            when(interviewRepository.findByApp_Id(appId)).thenReturn(null); // chưa có
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
            when(interviewRepository.save(any(Interview.class))).thenReturn(interview);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job)); // mapToResponse cũng gọi

            InterviewResponse response = interviewService.createSchedule(buildScheduleRequest(validScheduleTime));

            assertNotNull(response);
            verify(interviewRepository).save(any(Interview.class));
            verify(realInterview).sendEmail(any());     // email gửi khi tạo MỚI
        }

        @Test
        @DisplayName("Interview đã tồn tại — cập nhật, không gửi email lại")
        void createSchedule_existingInterview_updatesWithoutEmail() {
            when(interviewRepository.findByApp_Id(appId)).thenReturn(interview); // đã có
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(interviewRepository.save(any(Interview.class))).thenReturn(interview);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            interviewService.createSchedule(buildScheduleRequest(validScheduleTime));

            verify(interviewRepository).save(any(Interview.class));
            verify(realInterview, never()).sendEmail(any()); // KHÔNG gửi email khi update
        }

        @Test
        @DisplayName("ScheduleTime trước start — ném RuntimeException")
        void createSchedule_timeBeforeStart_throwsRuntimeException() {
            OffsetDateTime tooEarly = start.minusDays(1);
            when(interviewRepository.findByApp_Id(appId)).thenReturn(null);
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.createSchedule(buildScheduleRequest(tooEarly)));
            assertEquals("The interview must take place within the announced dates!", ex.getMessage());
        }

        @Test
        @DisplayName("ScheduleTime sau end — ném RuntimeException")
        void createSchedule_timeAfterEnd_throwsRuntimeException() {
            OffsetDateTime tooLate = end.plusDays(1);
            when(interviewRepository.findByApp_Id(appId)).thenReturn(null);
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.createSchedule(buildScheduleRequest(tooLate)));
            assertEquals("The interview must take place within the announced dates!", ex.getMessage());
        }

        @Test
        @DisplayName("Interviewer không tồn tại — ném RuntimeException")
        void createSchedule_interviewerNotFound_throwsRuntimeException() {
            when(interviewRepository.findByApp_Id(appId)).thenReturn(null);
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.createSchedule(buildScheduleRequest(validScheduleTime)));
            assertEquals("Interviewer not found!", ex.getMessage());
        }

        @Test
        @DisplayName("Application không tồn tại — ném RuntimeException")
        void createSchedule_applicationNotFound_throwsRuntimeException() {
            when(interviewRepository.findByApp_Id(appId)).thenReturn(null);
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(applicationRepository.findById(appId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.createSchedule(buildScheduleRequest(validScheduleTime)));
            assertEquals("Not found application!", ex.getMessage());
        }

        @Test
        @DisplayName("Status luôn được set là SCHEDULED sau khi lưu")
        void createSchedule_alwaysSetsStatusScheduled() {
            when(interviewRepository.findByApp_Id(appId)).thenReturn(null);
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(application));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
            when(interviewRepository.save(any(Interview.class))).thenReturn(interview);

            interviewService.createSchedule(buildScheduleRequest(validScheduleTime));

            verify(interviewRepository).save(argThat(i ->
                    i.getStatus() == InterviewStatus.SCHEDULED));
        }
    }

    // ====================================================================
    // getInterviewById()
    // ====================================================================
    @Nested
    @DisplayName("getInterviewById()")
    class GetInterviewById {

        @Test
        @DisplayName("Có interview — trả về danh sách response")
        void getInterviewById_found_returnsList() {
            when(interviewRepository.findAllByApp_Id(appId)).thenReturn(List.of(interview));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            List<InterviewResponse> result = interviewService.getInterviewById(appId);

            assertEquals(1, result.size());
            assertEquals(interviewId, result.get(0).getId());
        }

        @Test
        @DisplayName("Không có interview — trả về danh sách rỗng")
        void getInterviewById_notFound_returnsEmptyList() {
            when(interviewRepository.findAllByApp_Id(appId)).thenReturn(List.of());

            List<InterviewResponse> result = interviewService.getInterviewById(appId);

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Nhiều interview — map đủ tất cả thành response")
        void getInterviewById_multipleInterviews_mapsAll() {
            Interview interview2 = new Interview();
            interview2.setId(UUID.randomUUID());
            interview2.setApp(application);
            interview2.setInterviewer(interviewer);
            interview2.setScheduleTime(validScheduleTime.plusDays(1));
            interview2.setStatus(InterviewStatus.SCHEDULED);

            when(interviewRepository.findAllByApp_Id(appId))
                    .thenReturn(List.of(interview, interview2));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            List<InterviewResponse> result = interviewService.getInterviewById(appId);

            assertEquals(2, result.size());
        }
    }

    // ====================================================================
    // inputResult()
    // ====================================================================
    @Nested
    @DisplayName("inputResult()")
    class InputResult {

        @Test
        @DisplayName("CANCELLED — set application REJECTED, không cần score")
        void inputResult_cancelled_setsApplicationRejected() {
            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(interviewRepository.save(any())).thenReturn(interview);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            interviewService.inputResult(interviewId,
                    buildResultRequest(InterviewStatus.CANCELLED, null, "No show"));

            assertEquals(ApplicationStatus.REJECTED, application.getStatus());
        }

        @Test
        @DisplayName("DONE, app chưa có score — set score trực tiếp từ request")
        void inputResult_done_noExistingScore_setsScoreDirectly() {
            application.setScore(null); // chưa có score
            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(interviewRepository.save(any())).thenReturn(interview);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            interviewService.inputResult(interviewId,
                    buildResultRequest(InterviewStatus.COMPLETED, BigDecimal.valueOf(8.0), "Good"));

            assertEquals(BigDecimal.valueOf(8.0), application.getScore());
        }

        @Test
        @DisplayName("DONE, HR interviewer — trọng số 0.3 * score + 0.7 * appScore")
        void inputResult_done_hrRole_appliesWeightedScore() {
            // HR role: weight = 0.3
            // appScore = 6.0, score = 8.0 → total = 8.0*0.3 + 6.0*0.7 = 2.4 + 4.2 = 6.6
            application.setScore(BigDecimal.valueOf(6.0));
            Role tempHrRole = new Role();
            tempHrRole.setName(EmployeeRole.ROLE_HR);
            interviewer.getUser().setRoles(java.util.Set.of(tempHrRole));

            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(interviewRepository.save(any())).thenReturn(interview);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            interviewService.inputResult(interviewId,
                    buildResultRequest(InterviewStatus.COMPLETED, BigDecimal.valueOf(8.0), "Good"));

            assertEquals(0, BigDecimal.valueOf(6.6).compareTo(application.getScore()),
                    "HR weight=0.3: 8.0*0.3 + 6.0*0.7 phải = 6.6");
        }

        @Test
        @DisplayName("DONE, MANAGER interviewer — trọng số 0.7 * score + 0.3 * appScore")
        void inputResult_done_managerRole_appliesWeightedScore() {
            // Manager role: weight = 0.7
            // appScore = 6.0, score = 8.0 → total = 8.0*0.7 + 6.0*0.3 = 5.6 + 1.8 = 7.4
            application.setScore(BigDecimal.valueOf(6.0));
            User managerUser = new User();
            Role tempManagerRole = new Role();
            tempManagerRole.setName(EmployeeRole.ROLE_MANAGER);
            managerUser.setRoles(java.util.Set.of(tempManagerRole));
            interviewer.setUser(managerUser);

            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(interviewRepository.save(any())).thenReturn(interview);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            interviewService.inputResult(interviewId,
                    buildResultRequest(InterviewStatus.COMPLETED, BigDecimal.valueOf(8.0), "Great"));

            assertEquals(0, BigDecimal.valueOf(7.4).compareTo(application.getScore()),
                    "Manager weight=0.7: 8.0*0.7 + 6.0*0.3 phải = 7.4");
        }

        @Test
        @DisplayName("Score null khi không CANCELLED — ném RuntimeException")
        void inputResult_nullScore_throwsRuntimeException() {
            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.inputResult(interviewId,
                            buildResultRequest(InterviewStatus.COMPLETED, null, "ok")));
            assertEquals("Score is not empty!", ex.getMessage());
        }

        @Test
        @DisplayName("Score <= 0 — ném RuntimeException")
        void inputResult_scoreZeroOrBelow_throwsRuntimeException() {
            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.inputResult(interviewId,
                            buildResultRequest(InterviewStatus.COMPLETED, BigDecimal.valueOf(0), "bad")));
            assertEquals("Score must be between 0 and 10!", ex.getMessage());
        }

        @Test
        @DisplayName("Score > 10 — ném RuntimeException")
        void inputResult_scoreAboveTen_throwsRuntimeException() {
            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.inputResult(interviewId,
                            buildResultRequest(InterviewStatus.COMPLETED, BigDecimal.valueOf(11), "over")));
            assertEquals("Score must be between 0 and 10!", ex.getMessage());
        }

        @Test
        @DisplayName("Interview không tồn tại — ném RuntimeException")
        void inputResult_interviewNotFound_throwsRuntimeException() {
            when(interviewRepository.findById(any())).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.inputResult(UUID.randomUUID(),
                            buildResultRequest(InterviewStatus.COMPLETED, BigDecimal.valueOf(8), "ok")));
            assertEquals("Not found interview", ex.getMessage());
        }

        @Test
        @DisplayName("Interviewer không tồn tại — ném RuntimeException")
        void inputResult_interviewerNotFound_throwsRuntimeException() {
            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.inputResult(interviewId,
                            buildResultRequest(InterviewStatus.COMPLETED, BigDecimal.valueOf(8), "ok")));
            assertEquals("Interviewer not found!", ex.getMessage());
        }

        @Test
        @DisplayName("Score hợp lệ biên trên (10) — không ném exception")
        void inputResult_scoreTen_isValid() {
            application.setScore(null);
            when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
            when(employeeRepository.findById(interviewerId)).thenReturn(Optional.of(interviewer));
            when(interviewRepository.save(any())).thenReturn(interview);
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            assertDoesNotThrow(() -> interviewService.inputResult(interviewId,
                    buildResultRequest(InterviewStatus.COMPLETED, BigDecimal.valueOf(10), "perfect")));
        }
    }

    // ====================================================================
    // getInterviewList()
    // ====================================================================
    @Nested
    @DisplayName("getInterviewList()")
    class GetInterviewList {

        @Test
        @DisplayName("Trả về danh sách SCHEDULED theo interviewer, sort theo scheduleTime")
        void getInterviewList_scheduled_returnsList() {
            when(interviewRepository
                    .findByInterviewer_EmployeeIdAndStatusOrderByScheduleTime(
                            interviewerId, InterviewStatus.SCHEDULED))
                    .thenReturn(List.of(interview));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            List<InterviewResponse> result = interviewService.getInterviewList(interviewerId);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("App đã OFFER — xóa interview đó khỏi repo")
        void getInterviewList_appIsOffer_deletesInterview() {
            application.setStatus(ApplicationStatus.OFFER);
            when(interviewRepository
                    .findByInterviewer_EmployeeIdAndStatusOrderByScheduleTime(
                            interviewerId, InterviewStatus.SCHEDULED))
                    .thenReturn(List.of(interview));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            interviewService.getInterviewList(interviewerId);

            verify(interviewRepository).deleteById(interviewId);
        }

        @Test
        @DisplayName("App không phải OFFER — không xóa interview")
        void getInterviewList_appNotOffer_doesNotDelete() {
            application.setStatus(ApplicationStatus.INTERVIEW); // không phải OFFER
            when(interviewRepository
                    .findByInterviewer_EmployeeIdAndStatusOrderByScheduleTime(
                            interviewerId, InterviewStatus.SCHEDULED))
                    .thenReturn(List.of(interview));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            interviewService.getInterviewList(interviewerId);

            verify(interviewRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Không có interview — trả về danh sách rỗng")
        void getInterviewList_empty_returnsEmptyList() {
            when(interviewRepository
                    .findByInterviewer_EmployeeIdAndStatusOrderByScheduleTime(
                            any(), any()))
                    .thenReturn(List.of());

            List<InterviewResponse> result = interviewService.getInterviewList(interviewerId);

            assertTrue(result.isEmpty());
        }
    }

    // ====================================================================
    // sendInterviewList()
    // ====================================================================
    @Nested
    @DisplayName("sendInterviewList()")
    class SendInterviewList {

        @Test
        @DisplayName("Hợp lệ — tạo interview mới cho manager, trả về response")
        void sendInterviewList_valid_createsManagerInterviews() {
            List<UUID> ids = List.of(appId);
            when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
            when(interviewRepository.findAllByApp_IdIn(ids)).thenReturn(List.of(interview));
            when(interviewRepository.existsByApp_IdAndInterviewer_EmployeeId(
                    appId, department.getManager().getEmployeeId())).thenReturn(false);
            when(interviewRepository.save(any(Interview.class))).thenAnswer(inv -> {
                Interview i = inv.getArgument(0);
                i.setId(UUID.randomUUID());
                return i;
            });
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            List<InterviewResponse> result = interviewService.sendInterviewList(ids, deptId);

            assertEquals(1, result.size());
            verify(interviewRepository, times(1)).save(any(Interview.class));
        }

        @Test
        @DisplayName("Interview chưa có scheduleTime — ném RuntimeException")
        void sendInterviewList_noScheduleTime_throwsRuntimeException() {
            interview.setScheduleTime(null);
            List<UUID> ids = List.of(appId);
            when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
            when(interviewRepository.findAllByApp_IdIn(ids)).thenReturn(List.of(interview));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.sendInterviewList(ids, deptId));
            assertTrue(ex.getMessage().contains("hasn't interview day!"));
        }

        @Test
        @DisplayName("App đã có manager interview — ném RuntimeException")
        void sendInterviewList_managerAlreadyAssigned_throwsRuntimeException() {
            List<UUID> ids = List.of(appId);
            when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
            when(interviewRepository.findAllByApp_IdIn(ids)).thenReturn(List.of(interview));
            when(interviewRepository.existsByApp_IdAndInterviewer_EmployeeId(
                    appId, department.getManager().getEmployeeId())).thenReturn(true); // đã có

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.sendInterviewList(ids, deptId));
            assertTrue(ex.getMessage().contains("is existed!"));
        }

        @Test
        @DisplayName("Department không tồn tại — ném RuntimeException")
        void sendInterviewList_departmentNotFound_throwsRuntimeException() {
            when(departmentRepository.findById(deptId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.sendInterviewList(List.of(appId), deptId));
            assertEquals("Not found department!", ex.getMessage());
        }

        @Test
        @DisplayName("Department không có manager — ném RuntimeException")
        void sendInterviewList_departmentNoManager_throwsRuntimeException() {
            department.setManager(null);
            when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> interviewService.sendInterviewList(List.of(appId), deptId));
            assertEquals("This department does not have a manager assigned!", ex.getMessage());
        }

        @Test
        @DisplayName("Interview mới được set đúng manager, scheduleTime, status SCHEDULED")
        void sendInterviewList_createdInterviewHasCorrectFields() {
            List<UUID> ids = List.of(appId);
            when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
            when(interviewRepository.findAllByApp_IdIn(ids)).thenReturn(List.of(interview));
            when(interviewRepository.existsByApp_IdAndInterviewer_EmployeeId(
                    appId, department.getManager().getEmployeeId())).thenReturn(false);
            when(interviewRepository.save(any(Interview.class))).thenAnswer(inv -> {
                Interview i = inv.getArgument(0);
                i.setId(UUID.randomUUID());
                return i;
            });
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

            interviewService.sendInterviewList(ids, deptId);

            verify(interviewRepository).save(argThat(i ->
                    i.getInterviewer().equals(department.getManager())
                            && i.getScheduleTime().equals(validScheduleTime)
                            && i.getStatus() == InterviewStatus.SCHEDULED
            ));
        }
    }

    // ====================================================================
    // deleteInterview()
    // ====================================================================
    @Nested
    @DisplayName("deleteInterview()")
    class DeleteInterview {

        @Test
        @DisplayName("Gọi thành công — xóa tất cả interview chứa appId")
        void deleteInterview_validApp_deletesAllInterviews() {
            doNothing().when(interviewRepository).deleteAllByApp_Id(appId);

            assertDoesNotThrow(() -> interviewService.deleteInterview(appId));

            verify(interviewRepository).deleteAllByApp_Id(appId);
        }

        @Test
        @DisplayName("Truyền đúng appId xuống interviewRepository")
        void deleteInterview_passesCorrectIdToRepository() {
            interviewService.deleteInterview(appId);

            verify(interviewRepository).deleteAllByApp_Id(appId);
            verify(interviewRepository, never()).deleteAllByApp_Id(
                    argThat(id -> !id.equals(appId))); // không nhầm id khác
        }
    }
}