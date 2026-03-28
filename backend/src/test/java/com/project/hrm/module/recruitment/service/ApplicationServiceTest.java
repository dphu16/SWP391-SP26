package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.ApplicationRequest;
import com.project.hrm.module.recruitment.dto.request.DateLimitRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Candidate;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.entity.JobDetail;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.enums.JobStatus;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import com.project.hrm.module.recruitment.repository.CandidateRepository;
import com.project.hrm.module.recruitment.repository.JobRepository;
import com.project.hrm.module.recruitment.service.impl.ApplicationServiceImpl;
import com.project.hrm.module.recruitment.service.email.ExpectedInterview;
import com.project.hrm.module.recruitment.service.email.OfferEmail;
import com.project.hrm.module.recruitment.service.email.RejectEmail;
import com.project.hrm.module.recruitment.service.email.UploadCV;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApplicationServiceImpl – Unit Tests")
class ApplicationServiceTest {

    // ─────────────────────────────── mocks ────────────────────────────────
    @Mock private CandidateRepository   candidateRepository;
    @Mock private JobRepository         jobRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private CvReviewService       cvReviewService;
    @Mock private InterviewService      interviewService;
    @Mock private FileService           fileService;
    @Mock private UploadCV              uploadCV;
    @Mock private ExpectedInterview     expectedInterview;
    @Mock private OfferEmail            offerEmail;
    @Mock private RejectEmail           rejectEmail;

    @InjectMocks
    private ApplicationServiceImpl applicationService;

    // ─────────────────────────────── fixtures ─────────────────────────────
    private UUID appId;
    private UUID jobId;
    private UUID candidateId;

    private Application sampleApp;
    private Candidate   sampleCandidate;
    private Job         sampleJob;
    private JobDetail   sampleJobDetail;

    @BeforeEach
    void setUp() {
        appId       = UUID.randomUUID();
        jobId       = UUID.randomUUID();
        candidateId = UUID.randomUUID();

        Position pos = new Position();
        pos.setTitle("Software Engineer");

        Employee hr = new Employee();
        hr.setFullName("HR Manager");

        sampleJobDetail = new JobDetail();
        sampleJobDetail.setQuantity(2);

        sampleJob = new Job();
        sampleJob.setId(jobId);
        sampleJob.setPos(pos);
        sampleJob.setEmployee(hr);
        sampleJob.setJobDetail(sampleJobDetail);
        sampleJob.setStatus(JobStatus.OPEN);

        sampleCandidate = new Candidate();
        sampleCandidate.setId(candidateId);
        sampleCandidate.setEmail("candidate@example.com");
        sampleCandidate.setFullName("Nguyen Van A");
        sampleCandidate.setPhone("0901234567");

        sampleApp = new Application();
        sampleApp.setId(appId);
        sampleApp.setJob(sampleJob);
        sampleApp.setCandidate(sampleCandidate);
        sampleApp.setCvUrl("cv_file.pdf");
        sampleApp.setStatus(ApplicationStatus.APPLIED);
        sampleApp.setScore(BigDecimal.valueOf(8.5));
    }

    // ══════════════════════════════════════════════════════════════════════
    //  create()
    // ══════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("create()")
    class Create {

        /** Tao MultipartFile gia dung cho setCvUrl */
        private MultipartFile mockCvFile() {
            return new MockMultipartFile(
                    "cvUrl",
                    "candidate-cv.pdf",
                    "application/pdf",
                    "fake-pdf-content".getBytes()
            );
        }

        private ApplicationRequest buildRequest() {
            ApplicationRequest req = new ApplicationRequest();
            req.setEmail("candidate@example.com");
            req.setFullName("Nguyen Van A");
            req.setPhone("0901234567");
            req.setJobId(jobId);
            req.setCvUrl(mockCvFile());   // MultipartFile thay vi String
            return req;
        }

        @Test
        @DisplayName("Candidate chua ton tai -> tao moi + luu app + gui email")
        void create_newCandidate_createsAndSendsEmail() {
            ApplicationRequest req = buildRequest();
            when(candidateRepository.findByEmail(req.getEmail())).thenReturn(Optional.empty());
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(applicationRepository.existsByCandidateIdAndJobId(any(), any())).thenReturn(false);
            when(fileService.inputPDF(req.getCvUrl())).thenReturn("saved_cv.pdf");
            when(applicationRepository.save(any(Application.class))).thenReturn(sampleApp);

            ApplicationResponse response = applicationService.create(req);

            assertNotNull(response);
            verify(candidateRepository).save(any(Candidate.class));
            verify(fileService).inputPDF(req.getCvUrl());
            verify(applicationRepository).save(any(Application.class));
            verify(uploadCV).sendEmail(any());
        }

        @Test
        @DisplayName("Candidate da ton tai va da nop job nay -> reuse app, xoa CV cu")
        void create_existingCandidateAndApp_reuseAndDeleteOldCv() {
            ApplicationRequest req = buildRequest();
            when(candidateRepository.findByEmail(req.getEmail()))
                    .thenReturn(Optional.of(sampleCandidate));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(applicationRepository.existsByCandidateIdAndJobId(candidateId, jobId))
                    .thenReturn(true);
            when(applicationRepository.findByCandidateIdAndJobId(candidateId, jobId))
                    .thenReturn(sampleApp);
            when(fileService.inputPDF(req.getCvUrl())).thenReturn("new_cv.pdf");
            when(applicationRepository.save(any())).thenReturn(sampleApp);

            applicationService.create(req);

            verify(fileService).deletePDF("cv_file.pdf");
            verify(fileService).inputPDF(req.getCvUrl());
        }

        @Test
        @DisplayName("Status phai duoc set la APPLIED khi tao moi")
        void create_statusIsAlwaysApplied() {
            ApplicationRequest req = buildRequest();
            when(candidateRepository.findByEmail(any())).thenReturn(Optional.of(sampleCandidate));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(applicationRepository.existsByCandidateIdAndJobId(any(), any())).thenReturn(false);
            when(fileService.inputPDF(any())).thenReturn("cv.pdf");
            when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
                Application saved = inv.getArgument(0);
                assertEquals(ApplicationStatus.APPLIED, saved.getStatus());
                return sampleApp;
            });

            applicationService.create(req);
        }

        @Test
        @DisplayName("Job khong ton tai -> nem RuntimeException, khong luu app")
        void create_jobNotFound_throwsAndNeverSaves() {
            ApplicationRequest req = buildRequest();
            when(candidateRepository.findByEmail(any())).thenReturn(Optional.of(sampleCandidate));
            when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> applicationService.create(req));
            assertTrue(ex.getMessage().contains("Not found job"));
            verify(applicationRepository, never()).save(any());
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  getApplicationById()
    // ══════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("getApplicationById()")
    class GetApplicationById {

        @Test
        @DisplayName("ID hop le -> tra ve ApplicationResponse dung thong tin")
        void getApplicationById_existingId_returnsCorrectResponse() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));

            ApplicationResponse response = applicationService.getApplicationById(appId);

            assertNotNull(response);
            assertEquals(appId, response.getId());
            assertEquals(jobId, response.getJobId());
            assertEquals("Nguyen Van A", response.getFullName());
            assertEquals("candidate@example.com", response.getEmail());
        }

        @Test
        @DisplayName("ID khong ton tai -> nem RuntimeException message 'Application not found'")
        void getApplicationById_notFound_throwsWithCorrectMessage() {
            UUID unknown = UUID.randomUUID();
            when(applicationRepository.findById(unknown)).thenReturn(Optional.empty());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> applicationService.getApplicationById(unknown));
            assertEquals("Application not found", ex.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  getAppByJobIdAndStatus()
    // ══════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("getAppByJobIdAndStatus()")
    class GetAppByJobIdAndStatus {

        @Test
        @DisplayName("Co ket qua -> tra ve danh sach da map dung")
        void getAppByJobIdAndStatus_hasResults_returnsMappedList() {
            when(applicationRepository.findByJob_IdAndStatus(
                    eq(jobId), eq(ApplicationStatus.APPLIED)))
                    .thenReturn(List.of(sampleApp));

            List<ApplicationResponse> responses =
                    applicationService.getAppByJobIdAndStatus(jobId, ApplicationStatus.APPLIED);

            assertEquals(1, responses.size());
            assertEquals(appId, responses.get(0).getId());
        }

        @Test
        @DisplayName("Khong co ket qua -> tra ve danh sach rong")
        void getAppByJobIdAndStatus_noResults_returnsEmptyList() {
            when(applicationRepository.findByJob_IdAndStatus(any(), any()))
                    .thenReturn(List.of());

            assertTrue(applicationService
                    .getAppByJobIdAndStatus(jobId, ApplicationStatus.REJECTED).isEmpty());
        }

//        @Test
//        @DisplayName("Sort dung thu tu: score DESC -> candidate.fullName ASC")
//        void getAppByJobIdAndStatus_usesCorrectSort() {
//            when(applicationRepository.findByJob_IdAndStatus(any(), any()))
//                    .thenReturn(List.of());
//
//            applicationService.getAppByJobIdAndStatus(jobId, ApplicationStatus.APPLIED);
//
//            verify(applicationRepository).findByJob_IdAndStatus(
//                    eq(jobId),
//                    eq(ApplicationStatus.APPLIED),
//                    argThat(sort -> {
//                        List<Sort.Order> orders = sort.toList();
//                        return orders.size() == 2
//                                && orders.get(0).getProperty().equals("score")
//                                && orders.get(0).isDescending()
//                                && orders.get(1).getProperty().equals("candidate.fullName")
//                                && orders.get(1).isAscending();
//                    })
//            );
//        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  update()
    // ══════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("update()")
    class Update {

        /** MultipartFile hop le */
        private MultipartFile mockCvFile() {
            return new MockMultipartFile(
                    "cvUrl", "new-cv.pdf", "application/pdf", "new-content".getBytes());
        }

        private ApplicationRequest buildRequest(MultipartFile cvFile) {
            ApplicationRequest req = new ApplicationRequest();
            req.setEmail("candidate@example.com");
            req.setFullName("Nguyen Van B");
            req.setPhone("0909999999");
            req.setJobId(jobId);
            req.setCvUrl(cvFile);   // MultipartFile hoac null
            return req;
        }

        @Test
        @DisplayName("cvUrl moi hop le -> xoa CV cu + upload CV moi + gui email")
        void update_withNewCvUrl_replacesFileAndSendsEmail() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(fileService.inputPDF(any(MultipartFile.class))).thenReturn("new_cv.pdf");

            applicationService.update(appId, buildRequest(mockCvFile()));

            verify(fileService).deletePDF("cv_file.pdf");
            verify(fileService).inputPDF(any(MultipartFile.class));
            verify(uploadCV).sendEmail(any());
        }

        @Test
        @DisplayName("cvUrl null -> khong dung den file, van gui email")
        void update_nullCvUrl_skipsFileOps() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));

            applicationService.update(appId, buildRequest(null));

            verify(fileService, never()).deletePDF(any());
            verify(fileService, never()).inputPDF(any());
            verify(uploadCV).sendEmail(any());
        }

        @Test
        @DisplayName("cvUrl rong (empty file) -> khong dung den file, van gui email")
        void update_emptyCvUrl_skipsFileOps() {
            // MockMultipartFile rong — isEmpty() = true
            MultipartFile emptyFile = new MockMultipartFile("cvUrl", new byte[0]);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));

            applicationService.update(appId, buildRequest(emptyFile)); // isEmpty() = true

            verify(fileService, never()).deletePDF(any());
            verify(fileService, never()).inputPDF(any());
        }

        @Test
        @DisplayName("Application khong ton tai -> nem RuntimeException")
        void update_appNotFound_throwsRuntimeException() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.empty());
            assertThrows(RuntimeException.class,
                    () -> applicationService.update(appId, buildRequest(mockCvFile())));
        }

        @Test
        @DisplayName("Job khong ton tai -> nem RuntimeException")
        void update_jobNotFound_throwsRuntimeException() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.empty());
            assertThrows(RuntimeException.class,
                    () -> applicationService.update(appId, buildRequest(null)));
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  setDateLimit()
    // ══════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("setDateLimit()")
    class SetDateLimit {

        private DateLimitRequest buildRequest(OffsetDateTime start, OffsetDateTime end) {
            DateLimitRequest req = new DateLimitRequest();
            req.setId(appId);
            req.setStart(start);
            req.setEnd(end);
            return req;
        }

        @Test
        @DisplayName("Ngay hop le -> set INTERVIEW + luu + gui expectedInterview email")
        void setDateLimit_validDates_setsInterviewAndSendsEmail() {
            OffsetDateTime start = OffsetDateTime.now().plusDays(1);
            OffsetDateTime end   = start.plusDays(8);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(applicationRepository.save(any())).thenReturn(sampleApp);

            ApplicationResponse response = applicationService.setDateLimit(buildRequest(start, end));

            assertNotNull(response);
            verify(applicationRepository).save(argThat(a ->
                    a.getStatus().equals(ApplicationStatus.INTERVIEW)
                            && a.getStart().equals(start)
                            && a.getEnd().equals(end)));
            verify(expectedInterview).sendEmail(any());
        }

        @Test
        @DisplayName("Start truoc now hon 1 ngay -> nem RuntimeException")
        void setDateLimit_startBefore1DayAgo_throwsRuntimeException() {
            OffsetDateTime start = OffsetDateTime.now().minusDays(2);
            OffsetDateTime end   = start.plusDays(10);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> applicationService.setDateLimit(buildRequest(start, end)));
            assertTrue(ex.getMessage().contains("Start date must be at least a day before now"));
            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("End cach start < 7 ngay -> nem RuntimeException")
        void setDateLimit_endLessThan7DaysAfterStart_throwsRuntimeException() {
            OffsetDateTime start = OffsetDateTime.now().plusDays(1);
            OffsetDateTime end   = start.plusDays(3);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> applicationService.setDateLimit(buildRequest(start, end)));
            assertTrue(ex.getMessage().contains("at least a week before end date"));
        }

        @Test
        @DisplayName("Application khong ton tai -> nem RuntimeException")
        void setDateLimit_appNotFound_throwsRuntimeException() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.empty());
            assertThrows(RuntimeException.class,
                    () -> applicationService.setDateLimit(buildRequest(
                            OffsetDateTime.now().plusDays(1),
                            OffsetDateTime.now().plusDays(10))));
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  nextStage()
    // ══════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("nextStage()")
    class NextStage {

        @Test
        @DisplayName("Tat ca app co score -> set OFFER + saveAll + gui offerEmail moi app")
        void nextStage_allAppsHaveScore_setsOfferAndSendsOfferEmails() {
            List<UUID> ids = List.of(appId);
            when(applicationRepository.findAllById(ids)).thenReturn(List.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));

            List<ApplicationResponse> responses = applicationService.nextStage(ids);

            assertEquals(1, responses.size());
            verify(applicationRepository).saveAll(argThat(list ->
                    ((List<Application>) list).stream()
                            .allMatch(a -> a.getStatus().equals(ApplicationStatus.OFFER))));
            verify(offerEmail, times(1)).sendEmail(any());
        }

        @Test
        @DisplayName("Co app chua co score -> nem RuntimeException chua ten candidate")
        void nextStage_appMissingScore_throwsWithCandidateName() {
            sampleApp.setScore(null);
            when(applicationRepository.findAllById(anyList())).thenReturn(List.of(sampleApp));

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> applicationService.nextStage(List.of(appId)));
            assertTrue(ex.getMessage().contains(sampleCandidate.getFullName()));
            verify(applicationRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("ids = null -> nem IllegalArgumentException")
        void nextStage_nullIds_throwsIllegalArgumentException() {
            assertThrows(IllegalArgumentException.class,
                    () -> applicationService.nextStage(null));
        }

        @Test
        @DisplayName("ids = [] -> nem IllegalArgumentException")
        void nextStage_emptyIds_throwsIllegalArgumentException() {
            assertThrows(IllegalArgumentException.class,
                    () -> applicationService.nextStage(List.of()));
        }

        @Test
        @DisplayName("Khong tim thay application nao trong DB -> nem RuntimeException")
        void nextStage_noAppsInDb_throwsRuntimeException() {
            when(applicationRepository.findAllById(anyList())).thenReturn(List.of());
            assertThrows(RuntimeException.class,
                    () -> applicationService.nextStage(List.of(appId)));
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  lastStage()
    // ══════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("lastStage()")
    class LastStage {

        @Test
        @DisplayName("Status OFFER, con slot -> set HIRED + luu")
        void lastStage_offerWithSlotAvailable_setsHired() {
            sampleApp.setStatus(ApplicationStatus.OFFER);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(applicationRepository.countByJob_IdAndStatus(jobId, ApplicationStatus.HIRED))
                    .thenReturn(0L);
            when(applicationRepository.save(any())).thenReturn(sampleApp);

            ApplicationResponse response = applicationService.lastStage(appId);

            assertNotNull(response);
            verify(applicationRepository).save(argThat(a ->
                    a.getStatus().equals(ApplicationStatus.HIRED)));
        }

        @Test
        @DisplayName("Da du HIRED = quantity -> nem RuntimeException 'full quantity'")
        void lastStage_positionFull_throwsRuntimeException() {
            sampleApp.setStatus(ApplicationStatus.OFFER);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(applicationRepository.countByJob_IdAndStatus(jobId, ApplicationStatus.HIRED))
                    .thenReturn(2L);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> applicationService.lastStage(appId));
            assertTrue(ex.getMessage().contains("full quantity"));
        }

        @Test
        @DisplayName("Hire slot cuoi (count+1 == quantity) -> reject app con lai + dong job")
        void lastStage_lastSlotFilled_rejectsRemainingAppsAndClosesJob() {
            sampleApp.setStatus(ApplicationStatus.OFFER);

            Application pendingApp = new Application();
            pendingApp.setId(UUID.randomUUID());
            pendingApp.setJob(sampleJob);
            pendingApp.setCandidate(sampleCandidate);
            pendingApp.setStatus(ApplicationStatus.APPLIED);

            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(applicationRepository.countByJob_IdAndStatus(jobId, ApplicationStatus.HIRED))
                    .thenReturn(1L);
            when(applicationRepository.save(any())).thenReturn(sampleApp);
            when(applicationRepository.findByJob_IdAndStatusIsNot(jobId, ApplicationStatus.HIRED))
                    .thenReturn(List.of(pendingApp));

            applicationService.lastStage(appId);

            assertEquals(ApplicationStatus.REJECTED, pendingApp.getStatus());
            assertEquals(JobStatus.CLOSED, sampleJob.getStatus());
            verify(rejectEmail, times(1)).sendEmail(any());
            verify(applicationRepository).saveAll(any());
        }

        @Test
        @DisplayName("App da REJECTED trong danh sach remaining -> bo qua, khong gui email")
        void lastStage_alreadyRejectedAppsSkipped_noExtraEmail() {
            sampleApp.setStatus(ApplicationStatus.OFFER);

            Application alreadyRejected = new Application();
            alreadyRejected.setId(UUID.randomUUID());
            alreadyRejected.setJob(sampleJob);
            alreadyRejected.setCandidate(sampleCandidate);
            alreadyRejected.setStatus(ApplicationStatus.REJECTED);

            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
            when(applicationRepository.countByJob_IdAndStatus(jobId, ApplicationStatus.HIRED))
                    .thenReturn(1L);
            when(applicationRepository.save(any())).thenReturn(sampleApp);
            when(applicationRepository.findByJob_IdAndStatusIsNot(jobId, ApplicationStatus.HIRED))
                    .thenReturn(List.of(alreadyRejected));

            applicationService.lastStage(appId);

            verify(rejectEmail, never()).sendEmail(any());
        }

        @Test
        @DisplayName("Application khong ton tai -> nem RuntimeException")
        void lastStage_appNotFound_throwsRuntimeException() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.empty());
            assertThrows(RuntimeException.class, () -> applicationService.lastStage(appId));
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  delete()
    // ══════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Status APPLIED -> chi xoa CV, KHONG goi cvReview/interviewService")
        void delete_appliedStatus_skipsReviewAndInterviewDeletion() {
            sampleApp.setStatus(ApplicationStatus.APPLIED);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(applicationRepository.existsByCandidate_Id(candidateId)).thenReturn(false);

            applicationService.delete(appId);

            verify(fileService).deletePDF("cv_file.pdf");
            verify(cvReviewService,  never()).deleteReview(any());
            verify(interviewService, never()).deleteInterview(any());
            verify(applicationRepository).delete(sampleApp);
        }

        @Test
        @DisplayName("Status INTERVIEW -> xoa CV + goi cvReviewService + interviewService")
        void delete_nonAppliedStatus_deletesReviewAndInterview() {
            sampleApp.setStatus(ApplicationStatus.INTERVIEW);
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(applicationRepository.existsByCandidate_Id(candidateId)).thenReturn(true);

            applicationService.delete(appId);

            verify(fileService).deletePDF("cv_file.pdf");
            verify(cvReviewService).deleteReview(appId);
            verify(interviewService).deleteInterview(appId);
        }

        @Test
        @DisplayName("Candidate khong con app nao -> xoa luon candidate")
        void delete_noCandidateAppsLeft_deletesCandidate() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(applicationRepository.existsByCandidate_Id(candidateId)).thenReturn(false);

            applicationService.delete(appId);

            verify(candidateRepository).deleteById(candidateId);
        }

        @Test
        @DisplayName("Candidate con app khac -> KHONG xoa candidate")
        void delete_candidateHasOtherApps_doesNotDeleteCandidate() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.of(sampleApp));
            when(applicationRepository.existsByCandidate_Id(candidateId)).thenReturn(true);

            applicationService.delete(appId);

            verify(candidateRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Application khong ton tai -> nem RuntimeException, khong xoa gi ca")
        void delete_appNotFound_throwsAndNoSideEffects() {
            when(applicationRepository.findById(appId)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class, () -> applicationService.delete(appId));

            verify(fileService,            never()).deletePDF(any());
            verify(applicationRepository, never()).delete(any(Application.class));
            verify(candidateRepository,   never()).deleteById(any());
        }
    }
}