package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.dto.ChangeRequestResponseDTO;
import com.project.hrm.module.corehr.service.EmployeeChangeRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class EmployeeChangeRequestController {

    private final EmployeeChangeRequestService changeRequestService;

    public EmployeeChangeRequestController(EmployeeChangeRequestService changeRequestService) {
        this.changeRequestService = changeRequestService;
    }

    @PostMapping("/employee-change-requests")
    public ResponseEntity<ChangeRequestResponseDTO> createChangeRequest(
            @RequestHeader("X-Employee-Id") UUID employeeId,
            @Valid @RequestBody ChangeRequestCreateDTO dto) {

        UUID createdBy = employeeId;

        ChangeRequestResponseDTO response = changeRequestService.createChangeRequest(
                employeeId, dto, createdBy);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
