package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.ReviewDetailsRequest;
import com.project.hrm.module.evaluation.entity.ReviewDetails;
import com.project.hrm.module.evaluation.service.ReviewDetailsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/review-details")
public class ReviewDetailsController {
    private final ReviewDetailsService service;

    public ReviewDetailsController(ReviewDetailsService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ReviewDetails> create(@Valid @RequestBody ReviewDetailsRequest req){
        ReviewDetails saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{detailId}")
                .buildAndExpand(saved.getDetailId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<ReviewDetails>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{detailId}")
    public ResponseEntity<ReviewDetails> getById(@PathVariable UUID detailId){
        return ResponseEntity.ok(service.getById(detailId));
    }

    @PutMapping("/{detailId}")
    public ResponseEntity<ReviewDetails> update(@PathVariable UUID detailId, @RequestBody ReviewDetailsRequest req){
        return ResponseEntity.ok(service.update(detailId, req));
    }

    @DeleteMapping("/{detailId}")
    public ResponseEntity<Void> delete(@PathVariable UUID detailId){
        service.delete(detailId);
        return ResponseEntity.noContent().build();
    }
}

