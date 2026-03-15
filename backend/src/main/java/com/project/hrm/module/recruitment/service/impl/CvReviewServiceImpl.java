package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.recruitment.dto.request.CvReviewRequest;
import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import com.project.hrm.module.recruitment.dto.response.CvReviewResponse;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.CvReview;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.enums.ResultStatus;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import com.project.hrm.module.recruitment.repository.CvReviewRepository;
import com.project.hrm.module.recruitment.repository.JobRepository;
import com.project.hrm.module.recruitment.repository.REmployeeRepository;
import com.project.hrm.module.recruitment.service.CvReviewService;
import com.project.hrm.module.recruitment.service.JobService;
import com.project.hrm.module.recruitment.service.email.OfferEmail;
import com.project.hrm.module.recruitment.service.email.RejectEmail;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class CvReviewServiceImpl implements CvReviewService {
    private final ApplicationRepository applicationRepository;
    private final CvReviewRepository cvReviewRepository;
    private final REmployeeRepository rEmployeeRepository;
    private final JobRepository jobRepository;
    private final RejectEmail rejectEmail;

    @Override
    public CvReviewResponse create(CvReviewRequest request) {
        if(cvReviewRepository.existsByApp_Id(request.getAppId())){
            throw new RuntimeException("Review CV has done!");
        }
        Application app = applicationRepository.findById(request.getAppId())
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        Employee employee = rEmployeeRepository.findById(request.getReviewerId())
                .orElseThrow(() -> new RuntimeException("Reviewer not found!"));
        CvReview entity = new CvReview();
        entity.setApp(app);
        entity.setReviewer(employee);
        entity.setComment(request.getComment());
        entity.setResult(request.getResult());
        if(request.getResult().equals(ResultStatus.FAILED)){
            entity.getApp().setStatus(ApplicationStatus.REJECTED);
            Job job = jobRepository.findById(app.getJob().getId())
                    .orElseThrow(() -> new RuntimeException("Not found job"));
            EmailRequest emailRequest = rejectGmail(app, job);
            rejectEmail.sendEmail(emailRequest);
        }
        entity.setCreatedAt(OffsetDateTime.now());
        cvReviewRepository.save(entity);
        return mapToResponse(entity);
    }

    @Override
    public CvReviewResponse getReviewById(UUID id) {
        CvReview entity = cvReviewRepository.findByApp_Id(id);
        return mapToResponse(entity);
    }

    @Override
    public void deleteReview(UUID appId) {
        cvReviewRepository.deleteByApp_Id(appId);
    }

    private EmailRequest rejectGmail(Application app, Job job){
        EmailRequest request = new EmailRequest();
        request.setTitle(job.getPos().getTitle());
        request.setCandidateName(app.getCandidate().getFullName());
        request.setCanEmail(app.getCandidate().getEmail());
        request.setHrName(job.getEmployee().getFullName());
        return request;
    }

    private CvReviewResponse mapToResponse(CvReview entity){
        CvReviewResponse response = new CvReviewResponse();
        response.setId(entity.getId());
        response.setAppId(entity.getApp().getId());
        response.setReviewerId(entity.getReviewer().getEmployeeId());
        response.setReviewerName(entity.getReviewer().getFullName());
        response.setComment(entity.getComment());
        response.setResult(entity.getResult());
        return response;
    }
}
