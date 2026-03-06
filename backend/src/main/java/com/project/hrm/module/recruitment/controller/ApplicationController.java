package com.project.hrm.module.recruitment.controller;

import com.project.hrm.module.recruitment.dto.request.ApplicationRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApplicationResponse> create(
            @Valid @ModelAttribute ApplicationRequest request) {

        ApplicationResponse response = applicationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<ApplicationResponse>> getByJobId(
            @PathVariable UUID jobId) {

        return ResponseEntity.ok(
                applicationService.getApplicationByJobId(jobId)
        );
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApplicationResponse> update(
            @PathVariable UUID id,
            @ModelAttribute ApplicationRequest request) {
        ApplicationResponse response = applicationService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
