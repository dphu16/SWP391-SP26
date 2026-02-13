package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.DisciplinaryActionsRequest;
import com.project.hrm.evaluation.entity.DisciplinaryActions;
import com.project.hrm.evaluation.service.DisciplinaryActionsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/disciplinary-actions")
public class DisciplinaryActionsController {
    private final DisciplinaryActionsService service;

    public DisciplinaryActionsController(DisciplinaryActionsService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<DisciplinaryActions> create(@Valid @RequestBody DisciplinaryActionsRequest req){
        DisciplinaryActions saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{actionId}")
                .buildAndExpand(saved.getActionId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<DisciplinaryActions>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{actionId}")
    public ResponseEntity<DisciplinaryActions> getById(@PathVariable UUID actionId){
        return ResponseEntity.ok(service.getById(actionId));
    }

    @PutMapping("/{actionId}")
    public ResponseEntity<DisciplinaryActions> update(@PathVariable UUID actionId, @RequestBody DisciplinaryActionsRequest req){
        return ResponseEntity.ok(service.update(actionId, req));
    }

    @DeleteMapping("/{actionId}")
    public ResponseEntity<Void> delete(@PathVariable UUID actionId){
        service.delete(actionId);
        return ResponseEntity.noContent().build();
    }
}

