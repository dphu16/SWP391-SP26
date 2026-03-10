package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.recruitment.entity.Interview;
import com.project.hrm.module.recruitment.enums.InterviewStatus;
import com.project.hrm.module.recruitment.repository.InterviewRepository;
import com.project.hrm.module.recruitment.service.email.ExpectedInterview;
import com.project.hrm.module.recruitment.service.email.OfferEmail;
import com.project.hrm.module.recruitment.service.email.UploadCV;
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
import com.project.hrm.module.recruitment.service.ApplicationService;
import com.project.hrm.module.recruitment.service.FileService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final UploadCV uploadCV;
    private final ExpectedInterview expectedInterview;
    private final ApplicationRepository applicationRepository;
    private final FileService fileService;
    private final OfferEmail offerEmail;
    private final InterviewRepository interviewRepository;

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
        }
        app.setJob(job);
        app.setCandidate(candidate);
        String cvUrl = fileService.inputPDF(request.getCvUrl());
        app.setCvUrl(cvUrl);
        app.setStatus(ApplicationStatus.APPLIED);
        app.setCreatedAt(OffsetDateTime.now());
        applicationRepository.save(app);
        uploadCV.sendEmail(app);
        return mapToResponse(app);
    }

    @Override
    public ApplicationResponse getApplicationById(UUID id) {

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        return mapToResponse(application);
    }

    @Override
    public List<ApplicationResponse> getApplicationByJobId(UUID id) {

        List<Application> applications =
                applicationRepository.findByJob_Id(id);

        return applications.stream()
                .map(this::mapToResponse)
                .toList();
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
            String cvUrl = fileService.inputPDF(request.getCvUrl());
            app.setCvUrl(cvUrl);
        }
        uploadCV.sendEmail(app);
        return mapToResponse(app);
    }

    @Override
    public ApplicationResponse setDateLimit(DateLimitRequest request) {
        Application app = applicationRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        app.setStart(request.getStart());
        app.setEnd(request.getEnd());
        applicationRepository.save(app);
        expectedInterview.sendEmail(app);

        return mapToResponse(app);
    }

    @Override
    public List<ApplicationResponse> nextStage(List<UUID> ids) {

        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        List<Application> applications = applicationRepository.findAllById(ids);

        if (applications.isEmpty()) {
            throw new RuntimeException("Applications not found");
        }

        List<Interview> interviews = interviewRepository.findAllByApp_IdIn(ids);

        for (Interview interview : interviews) {
            interview.setStatus(InterviewStatus.COMPLETED);
        }

        for (Application app : applications) {
            app.setStatus(ApplicationStatus.OFFER);
        }

        interviewRepository.saveAll(interviews);
        applicationRepository.saveAll(applications);

        for (Application app : applications) {
            offerEmail.sendEmail(app);
        }

        return applications.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ApplicationResponse lastStage(UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        if(app.getStatus().equals(ApplicationStatus.OFFER)){
            app.setStatus(ApplicationStatus.HIRED);
            applicationRepository.save(app);
        }
        return mapToResponse(app);
    }

    @Override
    public void delete(UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        applicationRepository.delete(app);
    }

    private void updateCandidate(Candidate candidate, ApplicationRequest request) {
        candidate.setFullName(request.getFullName());
        candidate.setPhone(request.getPhone());
        candidate.setCreatedAt(OffsetDateTime.now());
        candidateRepository.save(candidate);
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
        app.setCvUrl(entity.getCvUrl());
        app.setStatus(entity.getStatus());
        if(entity.getStart()!=null){
            app.setStart(entity.getStart());
        }
        if(entity.getEnd()!=null){
            app.setEnd(entity.getEnd());
        }
        return app;
    }
}
