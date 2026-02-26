package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.request.AssignKpiRequest;
import com.project.hrm.evaluation.service.KpiStructureService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/kpi-structures")
public class KpiStructureController {

    private final KpiStructureService kpiStructureService;

    public KpiStructureController(KpiStructureService kpiStructureService) {
        this.kpiStructureService = kpiStructureService;
    }

    @PostMapping("/assign")
    public ResponseEntity<?> assignKpis(@RequestBody AssignKpiRequest request) {
        return ResponseEntity.ok(kpiStructureService.assignKpisToDepartment(request));
    }

    @PostMapping("/assign/draft")
    public ResponseEntity<?> saveDraft(@RequestBody AssignKpiRequest request) {
        return ResponseEntity.ok(kpiStructureService.saveStructureOnly(request));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<AssignKpiRequest.KpiDetailDto>> getKpisByDepartment(@PathVariable UUID departmentId) {
        return ResponseEntity.ok(kpiStructureService.getKpisByDepartment(departmentId));
    }
}
