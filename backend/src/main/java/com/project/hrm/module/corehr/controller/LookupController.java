package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.DepartmentOptionDTO;
import com.project.hrm.module.corehr.dto.request.PositionOptionDTO;
import com.project.hrm.module.corehr.service.lookup.LookupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/lookup")
public class LookupController {

    private final LookupService lookupService;

    public LookupController(LookupService lookupService) {
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
}
