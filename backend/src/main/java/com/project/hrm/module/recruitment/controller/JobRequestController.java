package com.project.hrm.module.recruitment.controller;

import com.project.hrm.module.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.module.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.module.recruitment.enums.RequestStatus;
import com.project.hrm.module.recruitment.service.JobRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/job-requests")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class JobRequestController {
    private final JobRequestService jobRequestService;

    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<JobRequestResponse> create(
            @Valid @RequestBody JobRequestRequest request) {

        JobRequestResponse response = jobRequestService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<JobRequestResponse>> getAll() {

        List<JobRequestResponse> responses =
                jobRequestService.getAllRequest();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/department-name/{name}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<JobRequestResponse>> getRequestToManager(
            @PathVariable("name") String name,
            @RequestParam("status") RequestStatus status) {

        List<JobRequestResponse> responses =
                jobRequestService.getRequestByDepartmentName(name, status);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/hr/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<JobRequestResponse>> getRequestToHr(
            @PathVariable("id") UUID id,
            @RequestParam("status") RequestStatus status) {

        List<JobRequestResponse> responses =
                jobRequestService.getRequestByReportTo(id, status);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/hr/null/submit")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<JobRequestResponse>> getRequestByHr() {

        List<JobRequestResponse> responses =
                jobRequestService.getRequestByHr();

        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/hr/list/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<JobRequestResponse>> choiceRequest(
            @PathVariable("id") UUID id,
            @RequestBody List<UUID> ids) {

        List<JobRequestResponse> response = jobRequestService.choiceHr(id, ids);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<JobRequestResponse> getById(
            @PathVariable("id") UUID id) {

        return ResponseEntity.ok(jobRequestService.getRequestById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<JobRequestResponse> updateBefore(
            @PathVariable("id") UUID id,
            @RequestBody JobRequestRequest request) {

        return ResponseEntity.ok(
                jobRequestService.update(id, request)
        );
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<JobRequestResponse> updateStatus(
            @PathVariable("id") UUID id,
            @RequestParam("status") RequestStatus status,
            @RequestParam(name = "comment", required = false) String comment) {

        return ResponseEntity.ok(
                jobRequestService.updateStatus(id, status, comment)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {

        jobRequestService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
