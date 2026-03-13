package com.project.hrm.module.recruitment.controller;

import com.project.hrm.module.recruitment.dto.request.CreateJobRequest;
import com.project.hrm.module.recruitment.dto.response.JobResponse;
import com.project.hrm.module.recruitment.enums.JobStatus;
import com.project.hrm.module.recruitment.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class JobController {
    private final JobService jobService;

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<JobResponse> create(
            @Valid @RequestBody CreateJobRequest request) {

        JobResponse response = jobService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<JobResponse>> getAll() {

        List<JobResponse> responses = jobService.getAllJob();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/hr/{hrId}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<JobResponse>> getJobByHrId(
            @PathVariable UUID hrId) {

        List<JobResponse> responses = jobService.getJobByEmployeeId(hrId);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/candidate/list-job")
    public ResponseEntity<List<JobResponse>> getActiveJob() {

        List<JobResponse> responses = jobService.getJobByStatus(JobStatus.OPEN);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/candidate/list-job/{id}")
    public ResponseEntity<JobResponse> getJobById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(jobService.getJobById(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<JobResponse> getDetailJobById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(jobService.getJobById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<JobResponse> update(
            @PathVariable UUID id,
            @RequestBody CreateJobRequest request) {

        return ResponseEntity.ok(
                jobService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<JobResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam JobStatus status) {

        JobResponse response = jobService.updateStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        jobService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
