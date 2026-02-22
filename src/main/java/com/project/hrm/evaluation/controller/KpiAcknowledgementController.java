package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.KpiAcknowledgementRequest;
import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import com.project.hrm.evaluation.service.KpiAcknowledgementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/employee-goals")
public class KpiAcknowledgementController {

    private final KpiAcknowledgementService service;

    public KpiAcknowledgementController(KpiAcknowledgementService service) {
        this.service = service;
    }

    @PostMapping("/{goalId}/acknowledge")
    public ResponseEntity<KpiAcknowledgement> acknowledge(
            @PathVariable UUID goalId,
            @Valid @RequestBody KpiAcknowledgementRequest req
    ){
        KpiAcknowledgement saved = service.acknowledge(goalId, req);
        return ResponseEntity.ok(saved);
    }
}