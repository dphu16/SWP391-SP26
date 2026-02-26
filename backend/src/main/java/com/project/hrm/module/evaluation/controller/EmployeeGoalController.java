package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.EmployeeGoalRequest;
import com.project.hrm.module.evaluation.dto.GoalStatusRequest;
import com.project.hrm.module.evaluation.entity.EmployeeGoal;
import com.project.hrm.module.evaluation.service.EmployeeGoalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class EmployeeGoalController {

    private final EmployeeGoalService service;

    public EmployeeGoalController(EmployeeGoalService service) {
        this.service = service;
    }

    // 9
    @PostMapping("/employee-goals")
    public ResponseEntity<EmployeeGoal> assign(
            @RequestBody EmployeeGoalRequest request){
        return ResponseEntity.ok(service.assign(request));
    }

    // 10
    @GetMapping("/employees/{id}/goals")
    public ResponseEntity<List<EmployeeGoal>> getByEmployee(
            @PathVariable UUID id){
        return ResponseEntity.ok(service.getByEmployee(id));
    }

    // 11
    @PatchMapping("/employee-goals/{id}")
    public ResponseEntity<EmployeeGoal> updateStatus(
            @PathVariable UUID id,
            @RequestBody GoalStatusRequest request){
        return ResponseEntity.ok(service.updateStatus(id, request));
    }
}