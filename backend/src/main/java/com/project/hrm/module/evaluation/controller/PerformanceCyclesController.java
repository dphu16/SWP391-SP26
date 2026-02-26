package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.CycleStatusRequest;
import com.project.hrm.module.evaluation.dto.PerformanceCyclesRequest;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.service.PerformanceCyclesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/performance-cycles")
public class PerformanceCyclesController {

    private final PerformanceCyclesService service;

    public PerformanceCyclesController(PerformanceCyclesService service) {
        this.service = service;
    }

    // POST /performance-cycles
    @PostMapping
    public ResponseEntity<PerformanceCycles> create(
            @RequestBody PerformanceCyclesRequest request){
        return ResponseEntity.ok(service.create(request));
    }

    // GET /performance-cycles
    @GetMapping
    public ResponseEntity<List<PerformanceCycles>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // PUT /performance-cycles/{id}
    @PutMapping("/{id}")
    public ResponseEntity<PerformanceCycles> update(
            @PathVariable UUID id,
            @RequestBody PerformanceCyclesRequest request){
        return ResponseEntity.ok(service.update(id, request));
    }

    // PATCH /performance-cycles/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<PerformanceCycles> updateStatus(
            @PathVariable UUID id,
            @RequestBody CycleStatusRequest request){
        return ResponseEntity.ok(service.updateStatus(id, request));
    }
}
