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
                .path("/{id}")
                .buildAndExpand(saved.getIdCycle())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<PerformanceCycles>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PerformanceCycles> getById(@PathVariable UUID id){
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PerformanceCycles> update(@PathVariable UUID id, @RequestBody PerformanceCyclesRequest req){
        return ResponseEntity.ok(service.update(id, req.toEntity()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id){
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

