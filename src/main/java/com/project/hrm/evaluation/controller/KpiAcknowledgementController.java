package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.KpiAcknowledgementRequest;
import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import com.project.hrm.evaluation.service.KpiAcknowledgementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/kpi-acknowledgements")
public class KpiAcknowledgementController {
    private final KpiAcknowledgementService service;

    public KpiAcknowledgementController(KpiAcknowledgementService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<KpiAcknowledgement> create(@Valid @RequestBody KpiAcknowledgementRequest req){
        KpiAcknowledgement saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{ackId}")
                .buildAndExpand(saved.getAckId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<KpiAcknowledgement>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{ackId}")
    public ResponseEntity<KpiAcknowledgement> getById(@PathVariable UUID ackId){
        return ResponseEntity.ok(service.getById(ackId));
    }

    @PutMapping("/{ackId}")
    public ResponseEntity<KpiAcknowledgement> update(@PathVariable UUID ackId, @RequestBody KpiAcknowledgementRequest req){
        return ResponseEntity.ok(service.update(ackId, req));
    }

    @DeleteMapping("/{ackId}")
    public ResponseEntity<Void> delete(@PathVariable UUID ackId){
        service.delete(ackId);
        return ResponseEntity.noContent().build();
    }
}
