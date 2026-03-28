package com.project.hrm.module.recruitment.controller;

import com.project.hrm.module.recruitment.dto.request.CvReviewRequest;
import com.project.hrm.module.recruitment.dto.response.CvReviewResponse;
import com.project.hrm.module.recruitment.service.CvReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cvReview")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CvReviewController {
    private final CvReviewService cvReviewService;
    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<CvReviewResponse> create(
            @Valid @RequestBody CvReviewRequest request) {

        CvReviewResponse response = cvReviewService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<CvReviewResponse> getCvReviewById(
            @PathVariable("id") UUID id) {

        return ResponseEntity.ok(cvReviewService.getReviewById(id));
    }

}
