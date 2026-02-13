package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.KpiLibraryRequest;
import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.service.KpiLibraryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import jakarta.validation.Valid;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/kpi-libraries")
public class KpiLibraryController {
    private final KpiLibraryService service;

    public KpiLibraryController(KpiLibraryService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<KpiLibrary> createKpiLibrary(@Valid @RequestBody KpiLibraryRequest kpiRequest){
        KpiLibrary toSave = kpiRequest.toEntity();
        KpiLibrary saved = service.create(toSave);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{kpiId}")
                .buildAndExpand(saved.getLibId())
                .toUri();

        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<KpiLibrary>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{kpiId}")
    public ResponseEntity<KpiLibrary> getById(@PathVariable UUID kpiId){
        return ResponseEntity.ok(service.getById(kpiId));
    }

    @PutMapping("/{kpiId}")
    public ResponseEntity<KpiLibrary> update(@PathVariable UUID kpiId, @RequestBody KpiLibraryRequest req){
        return ResponseEntity.ok(service.updateKpi(kpiId, req.toEntity()));
    }


    @DeleteMapping("/{kpiId}")
    public ResponseEntity<Void> delete(@PathVariable UUID kpiId){
        service.delete(kpiId);
        return ResponseEntity.noContent().build();
    }

}
