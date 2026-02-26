package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.TrainingParticipantRequest;
import com.project.hrm.module.evaluation.entity.TrainingParticipant;
import com.project.hrm.module.evaluation.service.TrainingParticipantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/training-participants")
public class TrainingParticipantController {
    private final TrainingParticipantService service;

    public TrainingParticipantController(TrainingParticipantService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TrainingParticipant> create(@Valid @RequestBody TrainingParticipantRequest req){
        TrainingParticipant saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{participantId}")
                .buildAndExpand(saved.getParticipantId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<TrainingParticipant>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{participantId}")
    public ResponseEntity<TrainingParticipant> getById(@PathVariable UUID participantId){
        return ResponseEntity.ok(service.getById(participantId));
    }

    @PutMapping("/{participantId}")
    public ResponseEntity<TrainingParticipant> update(@PathVariable UUID participantId, @RequestBody TrainingParticipantRequest req){
        return ResponseEntity.ok(service.update(participantId, req));
    }

    @DeleteMapping("/{participantId}")
    public ResponseEntity<Void> delete(@PathVariable UUID participantId){
        service.delete(participantId);
        return ResponseEntity.noContent().build();
    }
}

