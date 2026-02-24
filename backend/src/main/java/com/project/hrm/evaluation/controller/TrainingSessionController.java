package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.TrainingSessionRequest;
import com.project.hrm.evaluation.entity.TrainingSession;
import com.project.hrm.evaluation.service.TrainingSessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/training-sessions")
public class TrainingSessionController {
    private final TrainingSessionService service;

    public TrainingSessionController(TrainingSessionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TrainingSession> create(@Valid @RequestBody TrainingSessionRequest req){
        TrainingSession saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{sessionId}")
                .buildAndExpand(saved.getSessionId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<TrainingSession>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<TrainingSession> getById(@PathVariable UUID sessionId){
        return ResponseEntity.ok(service.getById(sessionId));
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<TrainingSession> update(@PathVariable UUID sessionId, @RequestBody TrainingSessionRequest req){
        return ResponseEntity.ok(service.update(sessionId, req));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> delete(@PathVariable UUID sessionId){
        service.delete(sessionId);
        return ResponseEntity.noContent().build();
    }
}

