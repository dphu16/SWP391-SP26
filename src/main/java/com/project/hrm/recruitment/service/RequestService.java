package com.project.hrm.recruitment.service;

import com.project.hrm.recruitment.dto.request.CreateReqRequest;
import com.project.hrm.recruitment.dto.response.RequestResponse;
import com.project.hrm.recruitment.dto.response.RequestTitleResponse;

import java.util.List;
import java.util.UUID;

public interface RequestService {

    RequestResponse createRequest(CreateReqRequest request);

    RequestResponse getRequestById(UUID requestId);

    List<RequestResponse> getAllRequest();

    List<RequestTitleResponse> getRequestByReportTo(UUID hrId);

    RequestResponse updateRequest(UUID requestId, CreateReqRequest request);

    void deleteRequest(UUID requestId);

}
