package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.CompetencyProfilesRequest;
import com.project.hrm.evaluation.entity.CompetencyProfiles;
import com.project.hrm.evaluation.service.CompetencyProfilesService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/competency-profiles")
public class CompetencyProfilesController {
    private final CompetencyProfilesService service;

    public CompetencyProfilesController(CompetencyProfilesService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CompetencyProfiles> create(@Valid @RequestBody CompetencyProfilesRequest req){
        CompetencyProfiles saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{profileId}")
                .buildAndExpand(saved.getProfileId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<CompetencyProfiles>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<CompetencyProfiles> getById(@PathVariable UUID profileId){
        return ResponseEntity.ok(service.getById(profileId));
    }

    @PutMapping("/{profileId}")
    public ResponseEntity<CompetencyProfiles> update(@PathVariable UUID profileId, @RequestBody CompetencyProfilesRequest req){
        return ResponseEntity.ok(service.update(profileId, req));
    }

    @DeleteMapping("/{profileId}")
    public ResponseEntity<Void> delete(@PathVariable UUID profileId){
        service.delete(profileId);
        return ResponseEntity.noContent().build();
    }
}

