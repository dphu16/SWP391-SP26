package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.dto.EmployeeGoalRequest;
import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.service.EmployeeGoalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employee-goals")
public class EmployeeGoalController {
    private final EmployeeGoalService service;

    public EmployeeGoalController(EmployeeGoalService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<EmployeeGoal> create(@Valid @RequestBody EmployeeGoalRequest req){
        EmployeeGoal saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{goalId}")
                .buildAndExpand(saved.getGoalId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<EmployeeGoal>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<EmployeeGoal> getById(@PathVariable UUID goalId){
        return ResponseEntity.ok(service.getById(goalId));
    }

    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<List<EmployeeGoal>> getByEmployeeId(@PathVariable UUID employeeId){
        return ResponseEntity.ok(service.getByEmployeeId(employeeId));
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<EmployeeGoal> update(@PathVariable UUID goalId, @RequestBody EmployeeGoalRequest req){
        return ResponseEntity.ok(service.update(goalId, req));
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> delete(@PathVariable UUID goalId){
        service.delete(goalId);
        return ResponseEntity.noContent().build();
    }
}

