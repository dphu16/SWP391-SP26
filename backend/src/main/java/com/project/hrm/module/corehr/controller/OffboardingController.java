package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.service.offboarding.IOffboardingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class OffboardingController {

    private final IOffboardingService offboardingService;

    public OffboardingController(IOffboardingService offboardingService) {
        this.offboardingService = offboardingService;
    }

    @PutMapping("/employees/{id}/terminate")
    public ResponseEntity<EmployeeDetailDTO> terminateEmployee(
            @PathVariable("id") UUID id) {
        EmployeeDetailDTO updated = offboardingService.terminateEmployee(id);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/employees/{id}/activate")
    public ResponseEntity<EmployeeDetailDTO> activateEmployee(
            @PathVariable("id") UUID id) {
        EmployeeDetailDTO updated = offboardingService.activateEmployee(id);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/employees/inactive")
    public ResponseEntity<List<InactiveEmployeeResponseDTO>> getInactiveEmployees() {
        List<InactiveEmployeeResponseDTO> inactiveList = offboardingService.getInactiveEmployees();
        return ResponseEntity.ok(inactiveList);
    }
}
