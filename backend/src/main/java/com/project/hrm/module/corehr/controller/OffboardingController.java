package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.service.offboarding.IOffboardingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class OffboardingController {

    private final IOffboardingService offboardingService;

    public OffboardingController(IOffboardingService offboardingService) {
        this.offboardingService = offboardingService;
    }

    @GetMapping("/employees/inactive")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<InactiveEmployeeResponseDTO>> getInactiveEmployees() {
        List<InactiveEmployeeResponseDTO> inactiveList = offboardingService.getInactiveEmployees();
        return ResponseEntity.ok(inactiveList);
    }
}
