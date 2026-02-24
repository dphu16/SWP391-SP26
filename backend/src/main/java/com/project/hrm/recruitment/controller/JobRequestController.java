package com.project.hrm.recruitment.controller;

import com.project.hrm.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.recruitment.enums.RequestStatus;
import com.project.hrm.recruitment.service.JobRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @GetMapping("/department/{id}")
    public ResponseEntity<List<JobRequestResponse>> getRequestToManager(
            @PathVariable UUID id) {

        List<JobRequestResponse> responses =
                jobRequestService.getRequestByDepartmentId(id);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/hr/{id}")
    public ResponseEntity<List<JobRequestResponse>> getRequestToHr(
            @PathVariable UUID id) {

        List<JobRequestResponse> responses =
                jobRequestService.getRequestByReportTo(id);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobRequestResponse> getById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(jobRequestService.getRequestById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobRequestResponse> updateBefore(
            @PathVariable UUID id,
            @RequestBody JobRequestRequest request) {

        return ResponseEntity.ok(
                jobRequestService.update(id, request)
        );
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<JobRequestResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam RequestStatus status,
            @RequestParam(required = false) String comment) {

        return ResponseEntity.ok(
                jobRequestService.updateStatus(id, status, comment)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        jobRequestService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
