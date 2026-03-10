package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.response.DependentDTO;
import com.project.hrm.module.corehr.service.directory.DependentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/v1/employees")
public class DependentController {

    private final DependentService dependentService;

    public DependentController(DependentService dependentService) {
        this.dependentService = dependentService;
    }

    /**
     * GET /api/v1/employees/{employeeId}/dependents
     * Trả về danh sách người phụ thuộc của nhân viên.
     */
    @GetMapping("/{employeeId}/dependents")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<DependentDTO>> getDependents(
            @PathVariable UUID employeeId) {
        List<DependentDTO> dependents = dependentService.getDependentsByEmployeeId(employeeId);
        return ResponseEntity.ok(dependents);
    }
}
