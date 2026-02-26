package com.project.hrm.recruitment.controller;

import com.project.hrm.recruitment.dto.request.CreateJobRequest;
import com.project.hrm.recruitment.dto.response.JobResponse;
import com.project.hrm.recruitment.enums.JobStatus;
import com.project.hrm.recruitment.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<JobResponse> create(
            @Valid @RequestBody CreateJobRequest request) {

        JobResponse response = jobService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> getAll() {

        List<JobResponse> responses =
                jobService.getAllJob();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/hr/{id}")
    public ResponseEntity<List<JobResponse>> getJobByHrId(
            @PathVariable UUID id) {

        List<JobResponse> responses =
                jobService.getJobByEmployeeId(id);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/candidate/list-job")
    public ResponseEntity<List<JobResponse>> getActiveJob() {

        List<JobResponse> responses =
                jobService.getJobByStatus("OPEN");

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getDetailJobById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(jobService.getJobById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobResponse> update(
            @PathVariable UUID id,
            @RequestBody CreateJobRequest request) {

        return ResponseEntity.ok(
                jobService.update(id, request)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<JobResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam JobStatus status) {

        JobResponse response = jobService.updateStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        jobService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
