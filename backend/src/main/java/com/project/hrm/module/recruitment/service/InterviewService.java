package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.InterviewRequest;
import com.project.hrm.module.recruitment.dto.response.InterviewResponse;
import com.project.hrm.module.recruitment.enums.InterviewStatus;

import java.util.List;
import java.util.UUID;

public interface InterviewService {

    InterviewResponse createSchedule(InterviewRequest request);
    InterviewResponse getInterviewById(UUID id);
    InterviewResponse inputResult(UUID id, InterviewRequest request);
    List<InterviewResponse> getInterviewByHr(UUID interviewer);

}
