package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.PerformanceRuleResultsRequest;
import com.project.hrm.evaluation.entity.PerformanceRuleResults;
import com.project.hrm.evaluation.service.PerformanceRuleResultsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/performance-rule-results")
public class PerformanceRuleResultsController {

    private final PerformanceRuleResultsService service;

    public PerformanceRuleResultsController(PerformanceRuleResultsService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PerformanceRuleResults> create(
            @Valid @RequestBody PerformanceRuleResultsRequest req) {

        PerformanceRuleResults saved = service.create(req);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{resultId}")
                .buildAndExpand(saved.getResultId())
                .toUri();

        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<PerformanceRuleResults>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{resultId}")
    public ResponseEntity<PerformanceRuleResults> getById(
            @PathVariable UUID resultId) {

        return ResponseEntity.ok(service.getById(resultId));
    }

    @PutMapping("/{resultId}")
    public ResponseEntity<PerformanceRuleResults> update(
            @PathVariable UUID resultId,
            @RequestBody PerformanceRuleResultsRequest req) {

        return ResponseEntity.ok(service.update(resultId, req));
    }

    @DeleteMapping("/{resultId}")
    public ResponseEntity<Void> delete(@PathVariable UUID resultId) {
        service.delete(resultId);
        return ResponseEntity.noContent().build();
    }
}
