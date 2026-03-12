package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.recruitment.dto.request.InterviewRequest;
import com.project.hrm.module.recruitment.dto.response.InterviewResponse;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Interview;
import com.project.hrm.module.recruitment.enums.InterviewStatus;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import com.project.hrm.module.recruitment.repository.InterviewRepository;
import com.project.hrm.module.recruitment.repository.REmployeeRepository;
import com.project.hrm.module.recruitment.service.InterviewService;
import com.project.hrm.module.recruitment.service.email.RealInterview;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class InterviewServiceImpl implements InterviewService {
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final REmployeeRepository employeeRepository;
    private final RealInterview realInterview;

    @Override
    public InterviewResponse createSchedule(InterviewRequest request) {
        Application app = applicationRepository.findById(request.getAppId())
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        Employee employee = employeeRepository.findById(request.getInterviewerId())
                .orElseThrow(() -> new RuntimeException("Interviewer not found!"));
        Interview entity = new Interview();
        entity.setApp(app);
        entity.setInterviewer(employee);
        entity.setScheduleTime(request.getScheduleTime());
        entity.setStatus(InterviewStatus.SCHEDULED);
        interviewRepository.save(entity);
        realInterview.sendEmail(entity);
        return mapToResponse(entity);
    }

    @Override
    public InterviewResponse getInterviewById(UUID id) {
        Interview entity = interviewRepository.findByApp_Id(id);
        return mapToResponse(entity);
    }

    @Override
    public InterviewResponse inputResult(UUID id,InterviewRequest request) {
        Interview entity = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found interview"));
        Employee employee = employeeRepository.findById(request.getInterviewerId())
                .orElseThrow(() -> new RuntimeException("Interviewer not found!"));
        entity.setInterviewer(employee);
        entity.setFeedback(request.getFeedback());
        entity.setScore(request.getScore());
        interviewRepository.save(entity);
        return mapToResponse(entity);
    }


    @Override
    public List<InterviewResponse> getInterviewByHr(UUID interviewer) {
        List<Interview> list = interviewRepository.findByInterviewer_EmployeeIdAndStatus(interviewer, InterviewStatus.SCHEDULED);
        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }


    private InterviewResponse mapToResponse(Interview entity){
        InterviewResponse response = new InterviewResponse();
        response.setId(entity.getId());
        response.setAppId(entity.getApp().getId());
        response.setInterviewerId(entity.getInterviewer().getEmployeeId());
        response.setInterviewerName(entity.getInterviewer().getFullName());
        response.setScheduleTime(entity.getScheduleTime());
        response.setStatus(entity.getStatus());
        if(entity.getFeedback() != null){
            response.setFeedback(entity.getFeedback());
            response.setScore(entity.getScore());
        }
        return response;
    }
}
