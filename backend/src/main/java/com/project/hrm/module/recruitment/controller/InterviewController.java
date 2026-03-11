package com.project.hrm.module.recruitment.controller;

import com.project.hrm.module.recruitment.dto.request.InterviewRequest;
import com.project.hrm.module.recruitment.dto.response.InterviewResponse;
import com.project.hrm.module.recruitment.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interview")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class InterviewController {
    private final InterviewService interviewService;
    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<InterviewResponse> createSchedule(
            @Valid @RequestBody InterviewRequest request) {

        InterviewResponse response = interviewService.createSchedule(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<InterviewResponse> getInterviewById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(interviewService.getInterviewById(id));
    }

    @PatchMapping("/{id}/result")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<InterviewResponse> inputResult(
            @PathVariable UUID id,
            @RequestBody InterviewRequest request) {

        InterviewResponse response = interviewService.inputResult(id, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/list/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<InterviewResponse>> getInterviewByHr(@PathVariable UUID id) {
        List<InterviewResponse> responses = interviewService.getInterviewByHr(id);
        return ResponseEntity.ok(responses);
    }

}
