package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.CvReviewRequest;
import com.project.hrm.module.recruitment.dto.response.CvReviewResponse;

import java.util.UUID;

public interface CvReviewService {
    CvReviewResponse create(CvReviewRequest request);
    CvReviewResponse getReviewById(UUID id);
}
