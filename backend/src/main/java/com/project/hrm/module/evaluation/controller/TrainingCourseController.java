package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.TrainingCourseRequest;
import com.project.hrm.module.evaluation.entity.TrainingCourse;
import com.project.hrm.module.evaluation.service.TrainingCourseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/training-courses")
public class TrainingCourseController {
    private final TrainingCourseService service;

    public TrainingCourseController(TrainingCourseService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TrainingCourse> create(@Valid @RequestBody TrainingCourseRequest req){
        TrainingCourse saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{courseId}")
                .buildAndExpand(saved.getCourseId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<TrainingCourse>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<TrainingCourse> getById(@PathVariable UUID courseId){
        return ResponseEntity.ok(service.getById(courseId));
    }

    @PutMapping("/{courseId}")
    public ResponseEntity<TrainingCourse> update(@PathVariable UUID courseId, @RequestBody TrainingCourseRequest req){
        return ResponseEntity.ok(service.update(courseId, req));
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> delete(@PathVariable UUID courseId){
        service.delete(courseId);
        return ResponseEntity.noContent().build();
    }
}

