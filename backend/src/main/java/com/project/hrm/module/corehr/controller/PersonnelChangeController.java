package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.PersonnelChangeRequestDTO;
import com.project.hrm.module.corehr.dto.response.PersonnelChangeResponseDTO;
import com.project.hrm.module.corehr.service.directory.PersonnelChangeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/personnel-changes")
public class PersonnelChangeController {

    private final PersonnelChangeService changeService;

    public PersonnelChangeController(PersonnelChangeService changeService) {
        this.changeService = changeService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PersonnelChangeResponseDTO> createRequest(
            @RequestBody PersonnelChangeRequestDTO dto,
            @RequestAttribute("employeeId") UUID requestedBy) {
        return ResponseEntity.ok(changeService.createRequest(dto, requestedBy));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<PersonnelChangeResponseDTO>> getPendingRequests() {
        return ResponseEntity.ok(changeService.getPendingRequests());
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<PersonnelChangeResponseDTO>> getMyRequests(
            @RequestAttribute("employeeId") UUID employeeId) {
        return ResponseEntity.ok(changeService.getMyRequests(employeeId));
    }

    @PutMapping("/{changeId}/manager-approve")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PersonnelChangeResponseDTO> managerApprove(
            @PathVariable("changeId") UUID changeId,
            @RequestAttribute("employeeId") UUID managerId) {
        return ResponseEntity.ok(changeService.managerApprove(changeId, managerId));
    }

    @PutMapping("/{changeId}/hr-confirm")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<PersonnelChangeResponseDTO> hrConfirm(
            @PathVariable("changeId") UUID changeId,
            @RequestAttribute("employeeId") UUID hrEmployeeId) {
        return ResponseEntity.ok(changeService.hrConfirm(changeId, hrEmployeeId));
    }

    @PutMapping("/{changeId}/reject")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<PersonnelChangeResponseDTO> reject(
            @PathVariable("changeId") UUID changeId,
            @RequestParam("reason") String reason,
            @RequestAttribute("employeeId") UUID rejectedBy) {
        return ResponseEntity.ok(changeService.reject(changeId, reason, rejectedBy));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<PersonnelChangeResponseDTO>> getEmployeeHistory(
            @PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(changeService.getEmployeeHistory(employeeId));
    }
}
