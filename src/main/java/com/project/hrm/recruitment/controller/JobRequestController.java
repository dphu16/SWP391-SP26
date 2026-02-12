package com.project.hrm.recruitment.controller;

import com.project.hrm.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.recruitment.service.JobRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-requests")
@RequiredArgsConstructor
public class JobRequestController {
    private final JobRequestService jobRequestService;

    @PostMapping
    public ResponseEntity<JobRequestResponse> create(
            @Valid @RequestBody JobRequestRequest request) {

        JobRequestResponse response = jobRequestService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<JobRequestResponse>> getAll() {

        List<JobRequestResponse> responses =
                jobRequestService.getAllRequest();

        return ResponseEntity.ok(responses);
    }
}
