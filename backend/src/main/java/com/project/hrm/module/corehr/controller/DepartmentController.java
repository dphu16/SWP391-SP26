package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.response.DepartmentResponse;
import com.project.hrm.module.corehr.service.request.EmployeeRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final EmployeeRequestService departmentService;

    public DepartmentController(EmployeeRequestService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> getDepartmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }
}
