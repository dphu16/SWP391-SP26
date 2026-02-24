package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.dto.response.ChangeRequestResponseDTO;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.service.request.EmployeeRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/employee-requests")
public class EmployeeRequestController {

    private final EmployeeRequestService requestService;
    private final EmployeeRepository employeeRepository;

    public EmployeeRequestController(EmployeeRequestService requestService,
            EmployeeRepository employeeRepository) {
        this.requestService = requestService;
        this.employeeRepository = employeeRepository;
    }

    // ─── POST /api/employee-requests ─────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ChangeRequestResponseDTO> createRequest(
            Authentication authentication,
            @Valid @RequestBody ChangeRequestCreateDTO dto) {

        UUID employeeId = resolveEmployeeId(authentication);
        ChangeRequestResponseDTO response = requestService.createChangeRequest(employeeId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── GET /api/employee-requests ──────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<ChangeRequestResponseDTO>> getMyRequests(
            Authentication authentication) {

        UUID employeeId = resolveEmployeeId(authentication);
        return ResponseEntity.ok(requestService.getMyRequests(employeeId));
    }

    // ─── GET /api/employee-requests/{id} ─────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ChangeRequestResponseDTO> getRequestDetail(
            @PathVariable UUID id,
            Authentication authentication) {

        UUID employeeId = resolveEmployeeId(authentication);
        return ResponseEntity.ok(requestService.getRequestDetail(id, employeeId));
    }

    // ─── PATCH /api/employee-requests/{id}/approve — HR only ─────────────────
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ChangeRequestResponseDTO> approveRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(requestService.approveRequest(id));
    }

    // ─── PATCH /api/employee-requests/{id}/reject — HR only ──────────────────
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ChangeRequestResponseDTO> rejectRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(requestService.rejectRequest(id));
    }

    // ─── Helper: resolve employeeId from JWT principal (username) ────────────
    private UUID resolveEmployeeId(Authentication auth) {
        String username = auth.getName();
        return employeeRepository.findByUser_Username(username)
                .orElseThrow(() -> new IllegalStateException("No employee profile for user: " + username))
                .getEmployeeId();
    }
}
