package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.entity.PerformanceRules;
import com.project.hrm.evaluation.service.PerformanceRulesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import jakarta.validation.Valid;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/performance-rules")
public class PerformanceRulesController {
    private final PerformanceRulesService service;

    public PerformanceRulesController(PerformanceRulesService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PerformanceRules> create(@Valid @RequestBody PerformanceRules req){
        PerformanceRules saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{ruleId}")
                .buildAndExpand(saved.getRuleId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<PerformanceRules>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{ruleId}")
    public ResponseEntity<PerformanceRules> getById(@PathVariable UUID ruleId){
        return ResponseEntity.ok(service.getById(ruleId));
    }

    @PutMapping("/{ruleId}")
    public ResponseEntity<PerformanceRules> update(@PathVariable UUID ruleId, @RequestBody PerformanceRules req){
        return ResponseEntity.ok(service.update(ruleId, req));
    }

    @DeleteMapping("/{ruleId}")
    public ResponseEntity<Void> delete(@PathVariable UUID ruleId){
        service.delete(ruleId);
        return ResponseEntity.noContent().build();
    }
}
