package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.InterviewRequest;
import com.project.hrm.module.recruitment.dto.response.InterviewResponse;

import java.util.List;
import java.util.UUID;

public interface InterviewService {

    InterviewResponse createSchedule(InterviewRequest request);
    List<InterviewResponse> getInterviewById(UUID id);
    InterviewResponse inputResult(UUID id, InterviewRequest request);
    List<InterviewResponse> getInterviewList(UUID interviewer);
    List<InterviewResponse> sendInterviewList(List<UUID> ids, UUID deptId);


}
