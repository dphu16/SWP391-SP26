package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import com.project.hrm.module.recruitment.enums.JobStatus;
import com.project.hrm.module.recruitment.service.*;
import com.project.hrm.module.recruitment.dto.request.ApplicationRequest;
import com.project.hrm.module.recruitment.dto.request.DateLimitRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Candidate;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import com.project.hrm.module.recruitment.repository.CandidateRepository;
import com.project.hrm.module.recruitment.repository.JobRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final CvReviewService cvReviewService;
    private final InterviewService interviewService;
    private final FileService fileService;
    private final Map<String, EmailService> emailService;

    @Override
    public ApplicationResponse create(ApplicationRequest request) {

        Candidate candidate = candidateRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    Candidate newCandidate = new Candidate();
                    newCandidate.setEmail(request.getEmail());
                    return newCandidate;
                });
        updateCandidate(candidate,request);
        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new RuntimeException("Not found job."));

        Application app = new Application();
        if (applicationRepository.existsByCandidateIdAndJobId(
                candidate.getId(), job.getId())) {
            app = applicationRepository.findByCandidateIdAndJobId(candidate.getId(), job.getId());
            if(!app.getStatus().equals(ApplicationStatus.APPLIED)){
                throw new RuntimeException("Exist this application has status "+app.getStatus());
            }
            fileService.deletePDF(app.getCvUrl());
        }
        app.setJob(job);
        app.setCandidate(candidate);
        String cvUrl = fileService.inputPDF(request.getCvUrl());
        app.setCvUrl(cvUrl);
        app.setStatus(ApplicationStatus.APPLIED);
        app.setCreatedAt(OffsetDateTime.now());
        applicationRepository.save(app);

        EmailRequest emailRequest = sendCV(app,job);
        emailService.get("UploadCV").sendEmail(emailRequest);
        return mapToResponse(app);
    }

    @Override
    public ApplicationResponse getApplicationById(UUID id) {

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        return mapToResponse(application);
    }

    @Override
    public List<ApplicationResponse> getAppByJobIdAndStatus(UUID id, ApplicationStatus status) {

        List<Application> applications =
                applicationRepository.findByJob_IdAndStatus(id, status);


        return applications.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ApplicationResponse update(UUID id, ApplicationRequest request) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        updateCandidate(app.getCandidate(), request);
        if (!(request.getCvUrl() == null || request.getCvUrl().isEmpty())){
            fileService.deletePDF(app.getCvUrl());
            String cvUrl = fileService.inputPDF(request.getCvUrl());
            app.setCvUrl(cvUrl);
        }
        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new RuntimeException("Not found job."));
        EmailRequest emailRequest = sendCV(app,job);
        emailService.get("UploadCV").sendEmail(emailRequest);
        return mapToResponse(app);
    }

    @Override
    public ApplicationResponse setDateLimit(DateLimitRequest request) {
        Application app = applicationRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        OffsetDateTime start = request.getStart();
        OffsetDateTime end = request.getEnd();
        if(start.isBefore(OffsetDateTime.now().minusDays(1))){
            throw new RuntimeException("Start date must be at least a day before now!");
        }
        if (!start.isBefore(end.minusDays(6))) {
            throw new RuntimeException("Start date must be at least a week before end date!");
        }
        app.setStart(request.getStart());
        app.setEnd(request.getEnd());
        app.setStatus(ApplicationStatus.INTERVIEW);
        applicationRepository.save(app);
        Job job = jobRepository.findById(app.getJob().getId())
                .orElseThrow(() -> new RuntimeException("Not found job."));
        EmailRequest emailRequest = expectedDay(app,job);
        emailService.get("ExpectedInterview").sendEmail(emailRequest);

        return mapToResponse(app);
    }

    @Override
    public List<ApplicationResponse> nextStage(List<UUID> ids) {

        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("No list to next status");
        }

        List<Application> applications = applicationRepository.findAllById(ids);

        if (applications.isEmpty()) {
            throw new RuntimeException("Applications not found");
        }

        for (Application app : applications) {
            if(app.getScore() == null){
                throw new RuntimeException("Applications "+ app.getCandidate().getFullName() +" hasn't score!");
            }
            app.setStatus(ApplicationStatus.OFFER);
        }

        applicationRepository.saveAll(applications);
        Job job = jobRepository.findById(applications.get(0).getJob().getId())
                .orElseThrow(() -> new RuntimeException("Not found job."));
        for (Application app : applications) {
            EmailRequest emailRequest = offerGmail(app,job);
            emailService.get("OfferEmail").sendEmail(emailRequest);
        }

        return applications.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ApplicationResponse rejectStage(UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        Job job = jobRepository.findById(app.getJob().getId())
                .orElseThrow(() -> new RuntimeException("Not found job"));
        app.setStatus(ApplicationStatus.REJECTED);
        EmailRequest emailRequest = rejectGmail(app, job);
        applicationRepository.save(app);
        emailService.get("RejectEmail").sendEmail(emailRequest);
        return mapToResponse(app);
    }

    @Override
    public ApplicationResponse lastStage(UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        Job job = jobRepository.findById(app.getJob().getId())
                .orElseThrow(() -> new RuntimeException("Not found job"));
        long count = applicationRepository.countByJob_IdAndStatus(app.getJob().getId(), ApplicationStatus.HIRED);
        if(count==job.getJobDetail().getQuantity()){
            throw new RuntimeException("Have full quantity in position!");
        }
        if(app.getStatus().equals(ApplicationStatus.OFFER)){
            app.setStatus(ApplicationStatus.HIRED);
            applicationRepository.save(app);
        }

        if((count+1)==job.getJobDetail().getQuantity()){
            List<Application> list = applicationRepository.findByJob_IdAndStatusIsNot(app.getJob().getId(), ApplicationStatus.HIRED);
            for(Application i: list){
                if(i.getStatus().equals(ApplicationStatus.REJECTED)) continue;

                i.setStatus(ApplicationStatus.REJECTED);
                EmailRequest emailRequest = rejectGmail(i,job);
                emailService.get("RejectEmail").sendEmail(emailRequest);

            }
            job.setStatus(JobStatus.CLOSED);
            applicationRepository.saveAll(list);
        }

        return mapToResponse(app);
    }

    @Override
    public List<ApplicationResponse> listAppsNoInterview(UUID jobId) {
        List<Application> list = applicationRepository.findAppByJobAndWithoutInterview(jobId);
        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<ApplicationResponse> listAppsHaveInterview(UUID jobId) {
        List<Application> list = applicationRepository.findAppByJobAndHasInterview(jobId);
        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void delete(UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        fileService.deletePDF(app.getCvUrl());
        if(!app.getStatus().equals(ApplicationStatus.APPLIED)){
            cvReviewService.deleteReview(id);
            interviewService.deleteInterview(id);
        }
        UUID candidateId = app.getCandidate().getId();
        applicationRepository.delete(app);
        boolean check = applicationRepository.existsByCandidate_Id(candidateId);
        if(!check) candidateRepository.deleteById(candidateId);
    }

    private void updateCandidate(Candidate candidate, ApplicationRequest request) {
        String name = request.getFullName();
        if (!name.matches("[\\p{L} ]*")) {
            throw new RuntimeException("Name exists digits or special char!");
        }
        String phone = request.getPhone();
        if(!phone.matches("\\d{10}")){
            throw new RuntimeException("Phone must enough 10 digits!");
        }
        candidate.setFullName(name);
        candidate.setPhone(request.getPhone());
        candidate.setCreatedAt(OffsetDateTime.now());
        candidateRepository.save(candidate);
    }

    private EmailRequest sendCV(Application app, Job job){
        EmailRequest request = new EmailRequest();
        request.setTitle(job.getPos().getTitle());
        request.setCandidateName(app.getCandidate().getFullName());
        request.setCanEmail(app.getCandidate().getEmail());
        request.setCanPhone(app.getCandidate().getPhone());
        request.setCvUrl("/cv/"+app.getCvUrl());
        return request;
    }

    private EmailRequest expectedDay(Application app, Job job){
        EmailRequest request = new EmailRequest();
        request.setTitle(job.getPos().getTitle());
        request.setCandidateName(app.getCandidate().getFullName());
        request.setCanEmail(app.getCandidate().getEmail());
        request.setStart(app.getStart());
        request.setEnd(app.getEnd());
        request.setHrName(job.getEmployee().getFullName());
        return request;
    }

    private EmailRequest offerGmail(Application app, Job job){
        EmailRequest request = new EmailRequest();
        request.setTitle(job.getPos().getTitle());
        request.setCandidateName(app.getCandidate().getFullName());
        request.setCanEmail(app.getCandidate().getEmail());
        request.setHrName(job.getEmployee().getFullName());
        return request;
    }

    private EmailRequest rejectGmail(Application app, Job job){
        EmailRequest request = new EmailRequest();
        request.setTitle(job.getPos().getTitle());
        request.setCandidateName(app.getCandidate().getFullName());
        request.setCanEmail(app.getCandidate().getEmail());
        request.setHrName(job.getEmployee().getFullName());
        return request;
    }

    private ApplicationResponse mapToResponse(Application entity) {
        ApplicationResponse app = new ApplicationResponse();
        app.setId(entity.getId());
        System.out.println(entity.getJob().getId()+" "+entity.getJob().getPos().getTitle());
        app.setJobId(entity.getJob().getId());
        app.setJobTitle(entity.getJob().getPos().getTitle());
        app.setCandidateId(entity.getCandidate().getId());
        app.setFullName(entity.getCandidate().getFullName());
        app.setEmail(entity.getCandidate().getEmail());
        app.setPhone(entity.getCandidate().getPhone());
        app.setCvUrl("/cv/"+entity.getCvUrl());
        app.setStatus(entity.getStatus());
        app.setScore(entity.getScore());
        if(entity.getStart()!=null){
            app.setStart(entity.getStart());
        }
        if(entity.getEnd()!=null){
            app.setEnd(entity.getEnd());
        }
        return app;
    }
}
