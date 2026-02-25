package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.*;
import com.project.hrm.evaluation.entity.PerformanceReviews;
import com.project.hrm.evaluation.service.PerformanceReviewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class PerformanceReviewsController {

    private final PerformanceReviewsService service;

    public PerformanceReviewsController(PerformanceReviewsService service) {
        this.service = service;
    }

    // 13
    @PostMapping("/performance-reviews")
    public ResponseEntity<PerformanceReviews> create(
            @RequestBody PerformanceReviewsRequest request){
        return ResponseEntity.ok(service.create(request));
    }

    // 14
    @GetMapping("/employees/{id}/performance-reviews")
    public ResponseEntity<List<PerformanceReviews>> getByEmployee(
            @PathVariable UUID id){
        return ResponseEntity.ok(service.getByEmployee(id));
    }

    // Get or create review for active cycle
    @GetMapping("/employees/{id}/review-active")
    public ResponseEntity<PerformanceReviews> getActiveReview(@PathVariable UUID id){
        return ResponseEntity.ok(service.getOrCreateForActiveCycle(id));
    }

    // 15
    @PutMapping("/performance-reviews/{id}")
    public ResponseEntity<PerformanceReviews> updateScore(
            @PathVariable UUID id,
            @RequestBody ReviewScoreRequest request){
        return ResponseEntity.ok(service.updateScore(id, request));
    }

    // 16
    @PatchMapping("/performance-reviews/{id}/finalize")
    public ResponseEntity<PerformanceReviews> finalizeReview(
            @PathVariable UUID id){
        return ResponseEntity.ok(service.finalizeReview(id));
    }

    // 17
    @PostMapping("/performance-reviews/{id}/decision")
    public ResponseEntity<String> createDecision(
            @PathVariable UUID id,
            @RequestBody DecisionRequest request){
        return ResponseEntity.ok(service.createDecision(id, request));
    }
}