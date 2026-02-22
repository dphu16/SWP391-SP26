package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.PerformanceCyclesRequest;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.service.PerformanceCyclesService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/performance-cycles")
public class PerformanceCyclesController {
    private final PerformanceCyclesService service;

    public PerformanceCyclesController(PerformanceCyclesService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PerformanceCycles> create(@Valid @RequestBody PerformanceCyclesRequest req){
        PerformanceCycles saved = service.create(req.toEntity());
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{cycleId}")
                .buildAndExpand(saved.getIdCycle())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<PerformanceCycles>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{cycleId}")
    public ResponseEntity<PerformanceCycles> getById(@PathVariable UUID cycleId){
        return ResponseEntity.ok(service.getById(cycleId));
    }

    @PutMapping("/{cycleId}")
    public ResponseEntity<PerformanceCycles> update(@PathVariable UUID cycleId, @RequestBody PerformanceCyclesRequest req){
        return ResponseEntity.ok(service.update(cycleId, req.toEntity()));
    }

}
