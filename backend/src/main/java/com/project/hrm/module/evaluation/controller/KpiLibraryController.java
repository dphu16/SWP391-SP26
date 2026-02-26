package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.KpiLibraryRequest;
import com.project.hrm.module.evaluation.dto.response.KpiLibraryResponse;
import com.project.hrm.module.evaluation.service.KpiLibraryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import jakarta.validation.Valid;

import java.net.URI;
import java.util.List;
import java.util.UUID;

// Giữ lại @CrossOrigin từ file 1 để cho phép React/Vite (port 5173) gọi API
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/kpi-libraries")
public class KpiLibraryController {

    private final KpiLibraryService service;

    public KpiLibraryController(KpiLibraryService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<KpiLibraryResponse> createKpiLibrary(@Valid @RequestBody KpiLibraryRequest kpiRequest){
        KpiLibraryResponse saved = service.create(kpiRequest);

        // Tạo URI Location để trả về header 'Location' - chuẩn RESTful (HTTP 201)
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{kpiId}")
                .buildAndExpand(saved.getLibId())
                .toUri();

        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<KpiLibraryResponse>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{kpiId}")
    public ResponseEntity<KpiLibraryResponse> getById(@PathVariable UUID kpiId){
        return ResponseEntity.ok(service.getById(kpiId));
    }

    @PutMapping("/{kpiId}")
    public ResponseEntity<KpiLibraryResponse> update(@PathVariable UUID kpiId, @Valid @RequestBody KpiLibraryRequest req){
        return ResponseEntity.ok(service.updateKpi(kpiId, req));
    }

    @DeleteMapping("/{kpiId}")
    public ResponseEntity<Void> delete(@PathVariable UUID kpiId){
        service.delete(kpiId);
        return ResponseEntity.noContent().build();
    }
}