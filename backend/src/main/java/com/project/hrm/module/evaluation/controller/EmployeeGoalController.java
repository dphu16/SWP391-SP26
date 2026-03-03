package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.EmployeeGoalRequest;
import com.project.hrm.module.evaluation.dto.GoalProgressRequest;
import com.project.hrm.module.evaluation.dto.GoalStatusRequest;
import com.project.hrm.module.evaluation.entity.EmployeeGoal;
import com.project.hrm.module.evaluation.service.EmployeeGoalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
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
            java.security.Principal principal,
            @RequestBody EmployeeGoalRequest request){
        return ResponseEntity.ok(service.assign(principal, request));
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

    @PatchMapping("/employee-goals/{id}/progress")
    public ResponseEntity<EmployeeGoal> updateProgress(
            @PathVariable UUID id,
            @RequestBody GoalProgressRequest request){
        return ResponseEntity.ok(service.updateProgress(id, request));
    }
}