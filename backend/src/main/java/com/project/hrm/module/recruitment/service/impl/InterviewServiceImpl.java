package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import com.project.hrm.module.recruitment.dto.request.InterviewRequest;
import com.project.hrm.module.recruitment.dto.response.InterviewResponse;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Interview;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.enums.InterviewStatus;
import com.project.hrm.module.recruitment.repository.*;
import com.project.hrm.module.recruitment.service.InterviewService;
import com.project.hrm.module.recruitment.service.email.RealInterview;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class InterviewServiceImpl implements InterviewService {
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final RealInterview realInterview;
    private final JobRepository jobRepository;

    @Override
    public InterviewResponse createSchedule(InterviewRequest request) {
        Interview entity = interviewRepository.findByApp_Id(request.getAppId());
        Employee employee = employeeRepository.findById(request.getInterviewerId())
                .orElseThrow(() -> new RuntimeException("Interviewer not found!"));

        Application app = applicationRepository.findById(request.getAppId())
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        boolean check = false;
        if(entity == null){
            check = true;

            entity = new Interview();
            entity.setApp(app);
        }
        OffsetDateTime start = app.getStart();
        OffsetDateTime end = app.getEnd();
        OffsetDateTime time = request.getScheduleTime();
        if (start.isAfter(time) || end.isBefore(time)) {
            throw new RuntimeException("The interview must take place within the announced dates!");
        }
        entity.setInterviewer(employee);
        entity.setScheduleTime(time);
        entity.setStatus(InterviewStatus.SCHEDULED);
        interviewRepository.save(entity);
        if(check){
            Job job = jobRepository.findById(app.getJob().getId())
                    .orElseThrow(() -> new RuntimeException("Not found job."));
            EmailRequest emailRequest = realDay(app, job, entity);
            realInterview.sendEmail(emailRequest);
        }

        return mapToResponse(entity);
    }

    @Override
    public List<InterviewResponse> getInterviewById(UUID id) {
        List<Interview> list = interviewRepository.findAllByApp_Id(id);
        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public InterviewResponse inputResult(UUID id,InterviewRequest request) {
        Interview entity = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found interview"));
        Employee employee = employeeRepository.findById(request.getInterviewerId())
                .orElseThrow(() -> new RuntimeException("Interviewer not found!"));
        entity.setInterviewer(employee);
        entity.setStatus(request.getStatus());
        if(request.getStatus().equals(InterviewStatus.CANCELLED)){
            entity.getApp().setStatus(ApplicationStatus.REJECTED);
        } else {
            if(request.getScore() == null){
                throw new RuntimeException("Score is not empty!");
            }
            if(request.getScore().doubleValue()<=0
                    || request.getScore().doubleValue()>10
            ){
                throw new RuntimeException("Score must be between 0 and 10!");
            }
            entity.setScore(request.getScore());

            if(entity.getApp().getScore() == null){
                entity.getApp().setScore(request.getScore());
            } else {
                double weight;
                double appScore = entity.getApp().getScore().doubleValue();
                double score = request.getScore().doubleValue();
                boolean isHrInterviewer = employee.getUser() != null
                        && employee.getUser().getRoles() != null
                        && employee.getUser().getRoles().stream()
                        .anyMatch(r -> r.getName() == EmployeeRole.ROLE_HR);

                if (isHrInterviewer) {
                    weight = 0.3;
                } else {
                    weight = 0.7;
                }
                double total = score*weight+appScore*(1-weight);

                BigDecimal totalScore = BigDecimal.valueOf(total);

                entity.getApp().setScore(totalScore);
            }
        }
        entity.setFeedback(request.getFeedback());
        interviewRepository.save(entity);
        return mapToResponse(entity);
    }


    @Override
    public List<InterviewResponse> getInterviewList(UUID interviewer) {
        List<Interview> interviews = interviewRepository.findByInterviewer_EmployeeIdAndStatusOrderByScheduleTime(interviewer, InterviewStatus.SCHEDULED);
        for(Interview i: interviews){
            boolean check = i.getApp().getStatus().equals(ApplicationStatus.OFFER);
            if(check) interviewRepository.deleteById(i.getId());
        }
        return interviews.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<InterviewResponse> sendInterviewList(List<UUID> ids, UUID deptId) {
        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new RuntimeException("Not found department!"));
        List<Interview> list = interviewRepository.findAllByApp_IdIn(ids);
        List<Interview> sendList = new ArrayList<>();
        boolean check;
        EmployeeRole role = EmployeeRole.ROLE_MANAGER;
        for(Interview i: list){
            if(i.getScheduleTime() == null){
                throw new RuntimeException(i.getApp().getCandidate().getFullName()+" hasn't interview day!");
            }
            check = interviewRepository.existsByApp_IdAndInterviewer_User_Roles_Name(i.getApp().getId(), role);
            if(check) {
                throw new RuntimeException("This app has name "+i.getApp().getCandidate().getFullName()+" is existed!");
            };
            Interview entity = new Interview();
            entity.setApp(i.getApp());
            entity.setInterviewer(dept.getManager());
            entity.setScheduleTime(i.getScheduleTime());
            entity.setStatus(InterviewStatus.SCHEDULED);
            interviewRepository.save(entity);
            sendList.add(entity);
        }
        return sendList.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void deleteInterview(UUID appId) {
        Application application = applicationRepository.findById(appId)
                        .orElseThrow(() -> new RuntimeException("Not found application"));
        interviewRepository.deleteAllByApp_Id(appId);
    }

    private EmailRequest realDay(Application app, Job job, Interview interview){
        EmailRequest request = new EmailRequest();
        request.setTitle(job.getPos().getTitle());
        request.setCandidateName(app.getCandidate().getFullName());
        request.setCanEmail(app.getCandidate().getEmail());
        request.setDate(interview.getScheduleTime());
        request.setHrName(interview.getInterviewer().getFullName());
        return request;
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
        response.setFullName(entity.getApp().getCandidate().getFullName());
        Job job = jobRepository.findById(entity.getApp().getJob().getId())
                .orElseThrow(() -> new RuntimeException("Not found job!"));
        response.setJobTitle(job.getPos().getTitle());
        return response;
    }
}
