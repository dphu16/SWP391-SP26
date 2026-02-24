package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.dto.response.ChangeRequestResponseDTO;
import com.project.hrm.module.corehr.service.request.EmployeeRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class EmployeeRequestController {

    private final EmployeeRequestService changeRequestService;

    public EmployeeRequestController(EmployeeRequestService changeRequestService) {
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
