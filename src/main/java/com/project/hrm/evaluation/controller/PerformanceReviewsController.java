package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.entity.PerformanceReviews;
import com.project.hrm.evaluation.service.PerformanceReviewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import jakarta.validation.Valid;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/performance-reviews")
public class PerformanceReviewsController {
    private final PerformanceReviewsService service;

    public PerformanceReviewsController(PerformanceReviewsService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PerformanceReviews> create(@Valid @RequestBody PerformanceReviews req){
        PerformanceReviews saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<PerformanceReviews>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PerformanceReviews> getById(@PathVariable UUID id){
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PerformanceReviews> update(@PathVariable UUID id, @RequestBody PerformanceReviews req){
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id){
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

