package com.project.hrm.module.recruitment.controller;

import com.project.hrm.module.recruitment.dto.request.ApplicationRequest;
import com.project.hrm.module.recruitment.dto.request.DateLimitRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.dto.response.InterviewResponse;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/app")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApplicationResponse> create(
            @Valid @ModelAttribute ApplicationRequest request) {

        ApplicationResponse response = applicationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/candidate",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApplicationResponse> applyCv(
            @Valid @ModelAttribute ApplicationRequest request) {

        ApplicationResponse response = applicationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApplicationResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<ApplicationResponse>> getByJobId(
            @PathVariable UUID jobId,
            @RequestParam ApplicationStatus status) {

        return ResponseEntity.ok(
                applicationService.getAppByJobIdAndStatus(jobId, status)
        );
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApplicationResponse> update(
            @PathVariable UUID id,
            @ModelAttribute ApplicationRequest request) {
        ApplicationResponse response = applicationService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/date-limit")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApplicationResponse> setDateLimit(@RequestBody DateLimitRequest request) {
        ApplicationResponse response = applicationService.setDateLimit(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/last-stage/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApplicationResponse> lastStage(@PathVariable UUID id) {
        ApplicationResponse response = applicationService.lastStage(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/list/next-stage")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<ApplicationResponse>> nextStage(@RequestBody List<UUID> ids) {
        List<ApplicationResponse> responses = applicationService.nextStage(ids);
        return ResponseEntity.ok(responses);
    }



}
