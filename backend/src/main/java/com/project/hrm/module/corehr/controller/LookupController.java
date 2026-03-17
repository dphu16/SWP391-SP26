package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.DepartmentOptionDTO;
import com.project.hrm.module.corehr.dto.request.PositionOptionDTO;
import com.project.hrm.module.corehr.service.lookup.DropdownService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/lookup")
public class LookupController {

    private final DropdownService lookupService;

    public LookupController(DropdownService lookupService) {
        this.lookupService = lookupService;
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentOptionDTO>> getDepartments() {
        return ResponseEntity.ok(lookupService.getAllDepartmentOptions());
    }

    @GetMapping("/positions")
    public ResponseEntity<List<PositionOptionDTO>> getPositions() {
        return ResponseEntity.ok(lookupService.getAllPositionOptions());
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<DepartmentOptionDTO> getDepartmentByManager(
            @PathVariable UUID id) {

        DepartmentOptionDTO responses = lookupService.getDepartmentByManagerId(id);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/pos/{id}")
    public ResponseEntity<List<PositionOptionDTO>> getPositionByDeptId(
            @PathVariable UUID id) {

        List<PositionOptionDTO> responses = lookupService.getPositionByDeptId(id);

        return ResponseEntity.ok(responses);
    }
}
