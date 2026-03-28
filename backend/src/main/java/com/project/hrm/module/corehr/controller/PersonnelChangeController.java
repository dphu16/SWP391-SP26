package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.PersonnelChangeRequestDTO;
import com.project.hrm.module.corehr.dto.response.PersonnelChangeResponseDTO;
import com.project.hrm.module.corehr.service.directory.PersonnelChangeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<PersonnelChangeResponseDTO> createRequest(
            @RequestBody PersonnelChangeRequestDTO dto,
            @RequestAttribute("employeeId") UUID requestedBy,
            org.springframework.security.core.Authentication authentication) {
        boolean isHr = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("HR"));
        return ResponseEntity.ok(changeService.createRequest(dto, requestedBy, isHr));
    }

    @PutMapping("/{changeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<PersonnelChangeResponseDTO> updateRequest(
            @PathVariable("changeId") UUID changeId,
            @RequestBody PersonnelChangeRequestDTO dto,
            @RequestAttribute("employeeId") UUID requestedBy,
            org.springframework.security.core.Authentication authentication) {
        boolean isHr = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("HR"));
        return ResponseEntity.ok(changeService.updateRequest(changeId, dto, requestedBy, isHr));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<PersonnelChangeResponseDTO>> getPendingRequests(
            @RequestAttribute("employeeId") UUID employeeId,
            org.springframework.security.core.Authentication authentication) {
        boolean isHr = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("HR"));
        if (isHr) {
            return ResponseEntity.ok(changeService.getPendingRequests());
        }
        return ResponseEntity.ok(changeService.getPendingRequestsForManager(employeeId));
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'FINANCE')")
    public ResponseEntity<List<PersonnelChangeResponseDTO>> getMyRequests(
            @RequestAttribute(name = "employeeId", required = false) UUID employeeId) {
        if (employeeId == null) return ResponseEntity.ok(java.util.List.of());
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

    /**
     * HR reject: không giới hạn phòng
     */
    @PutMapping("/{changeId}/hr-reject")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<PersonnelChangeResponseDTO> hrReject(
            @PathVariable("changeId") UUID changeId,
            @RequestParam("reason") String reason,
            @RequestAttribute("employeeId") UUID rejectedBy) {
        return ResponseEntity.ok(changeService.reject(changeId, reason, rejectedBy, false));
    }

    /**
     * Manager reject: chỉ được từ chối yêu cầu của nhân viên trong phòng mình
     */
    @PutMapping("/{changeId}/manager-reject")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PersonnelChangeResponseDTO> managerReject(
            @PathVariable("changeId") UUID changeId,
            @RequestParam("reason") String reason,
            @RequestAttribute("employeeId") UUID rejectedBy) {
        return ResponseEntity.ok(changeService.reject(changeId, reason, rejectedBy, true));
    }

    /**
     * General reject: available to the requester themselves to cancel their own request,
     * or HR/Manager with appropriate permissions.
     */
    @PutMapping("/{changeId}/reject")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<PersonnelChangeResponseDTO> reject(
            @PathVariable("changeId") UUID changeId,
            @RequestParam("reason") String reason,
            @RequestAttribute("employeeId") UUID rejectedBy,
            org.springframework.security.core.Authentication authentication) {
        boolean isHr = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("HR"));
        return ResponseEntity.ok(changeService.rejectUnified(changeId, reason, rejectedBy, isHr));
    }

    /**
     * HR: xem lịch sử thay đổi của bất kỳ nhân viên nào
     */
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<List<PersonnelChangeResponseDTO>> getEmployeeHistory(
            @PathVariable("employeeId") UUID employeeId,
            @RequestAttribute("employeeId") UUID managerId,
            org.springframework.security.core.Authentication authentication) {
        boolean isHr = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("HR"));
        if (isHr) {
            return ResponseEntity.ok(changeService.getEmployeeHistory(employeeId));
        }
        return ResponseEntity.ok(changeService.getEmployeeHistoryForManager(employeeId, managerId));
    }
}
