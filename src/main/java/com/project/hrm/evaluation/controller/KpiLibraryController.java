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
                .path("/{id}")
                .buildAndExpand(saved.getLibId())
                .toUri();

        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<KpiLibrary>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{idKpi}")
    public ResponseEntity<KpiLibrary> getById(@PathVariable UUID idKpi){
        return ResponseEntity.ok(service.getById(idKpi));
    }

    @PutMapping("/{idKpi}")
    public ResponseEntity<KpiLibrary> updateById(@PathVariable UUID idKpi, @RequestBody KpiLibrary kpiLibrary){
        return ResponseEntity.ok(service.updateKpi(idKpi, kpiLibrary));
    }


    @DeleteMapping("/{idKpi}")
    public ResponseEntity<Void> delete(@PathVariable UUID idKpi){
        service.delete(idKpi);
        return ResponseEntity.noContent().build();
    }

}
