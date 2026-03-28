package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeSelfUpdateDTO;
import com.project.hrm.module.corehr.dto.response.ContractResponseDTO;
import com.project.hrm.module.corehr.service.AuditLogService;
import com.project.hrm.module.corehr.service.directory.ContractService;
import com.project.hrm.module.corehr.service.directory.EmployeeSelfUpdateService;
import com.project.hrm.module.corehr.service.directory.IEmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class EmployeeController {

    private final IEmployeeService employeeService;
    private final EmployeeSelfUpdateService selfUpdateService;
    private final ContractService contractService;
    private final AuditLogService auditLogService;

    public EmployeeController(IEmployeeService employeeService,
            EmployeeSelfUpdateService selfUpdateService,
            ContractService contractService,
            AuditLogService auditLogService) {
        this.employeeService = employeeService;
        this.selfUpdateService = selfUpdateService;
        this.contractService = contractService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/hr/employees")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Page<EmployeeDTO>> getAllEmployees(
            @RequestAttribute(value = "employeeId", required = false) UUID currentEmployeeId,
            Authentication authentication,
            @PageableDefault(size = 10, sort = "fullName") Pageable pageable) {

        UUID filterDeptId = getMemberFilterDeptId(currentEmployeeId, authentication);

        Page<EmployeeDTO> result = employeeService.searchEmployees(null, null, null, null, null, null, null, null,
                filterDeptId, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("employee/{id}/view-detail")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'FINANCE')")
    public ResponseEntity<EmployeeDetailDTO> getEmployeeDetail(
            @PathVariable("id") UUID id) {

        EmployeeDetailDTO dto = employeeService.getEmployeeDetail(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/employees/{id}/edit")
    @PreAuthorize("hasRole('HR') and !hasRole('MANAGER')")
    public ResponseEntity<EmployeeDetailDTO> updateEmployee(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EmployeeChangeDTO req) {
        EmployeeDetailDTO updated = employeeService.updateEmployee(id, req);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/employees/search")
    public ResponseEntity<Page<EmployeeDTO>> searchEmployees(
            @RequestAttribute(value = "employeeId", required = false) UUID currentEmployeeId,
            Authentication authentication,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "employeeCode", required = false) String employeeCode,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "position", required = false) String position,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "q", required = false) String q,
            @PageableDefault(size = 10, sort = "fullName") Pageable pageable) {

        if (phoneNumber != null && !phoneNumber.matches("^[0-9\\-\\s]+$")) {
            throw new IllegalArgumentException("Phone number contains invalid characters.");
        }

        UUID filterDeptId = getMemberFilterDeptId(currentEmployeeId, authentication);

        Page<EmployeeDTO> result = employeeService.searchEmployees(
                q, fullName, employeeCode, phoneNumber, department, position, role, status, filterDeptId, pageable);
        return ResponseEntity.ok(result);
    }

    private UUID getMemberFilterDeptId(UUID currentEmployeeId, Authentication authentication) {
        if (currentEmployeeId != null && authentication != null) {
            boolean isHR = hasRole(authentication, "ROLE_HR");
            boolean isManager = hasRole(authentication, "ROLE_MANAGER");

            if (isManager && !isHR) {
                EmployeeDetailDTO manager = employeeService.getEmployeeDetail(currentEmployeeId);
                return manager.getDeptId();
            }
        }
        return null;
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(r -> r.equals(role));
    }

    // Employee views profile
    @GetMapping("/employee/profile")
    public ResponseEntity<EmployeeDetailDTO> getMyProfile(
            @RequestAttribute("employeeId") UUID employeeId) {
        EmployeeDetailDTO dto = employeeService.getEmployeeDetail(employeeId);
        return ResponseEntity.ok(dto);
    }

    // Employee self-update (phone, email, address)
    @PutMapping("/employees/self-update")
    @PreAuthorize("isAuthenticated() and !hasRole('MANAGER')")
    public ResponseEntity<EmployeeDetailDTO> selfUpdate(
            @RequestAttribute("employeeId") UUID employeeId,
            @RequestBody EmployeeSelfUpdateDTO dto) {
        EmployeeDetailDTO updated = selfUpdateService.selfUpdate(employeeId, dto);
        return ResponseEntity.ok(updated);
    }

    // Get contracts for an employee
    @GetMapping("/employees/{id}/contracts")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<ContractResponseDTO>> getEmployeeContracts(
            @PathVariable("id") UUID employeeId) {
        return ResponseEntity.ok(contractService.getContractsByEmployee(employeeId));
    }

    // Get contracts expiring within 30 days
    @GetMapping("/contracts/expiring")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<ContractResponseDTO>> getExpiringContracts() {
        return ResponseEntity.ok(contractService.getExpiringContracts());
    }

    // Get Employee Activity Logs
    @GetMapping("/employees/{id}/activity-logs")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE','FINANCE')")
    public ResponseEntity<List<com.project.hrm.module.corehr.dto.response.AuditLogResponseDTO>> getEmployeeActivityLogs(
            @PathVariable("id") UUID employeeId) {
        return ResponseEntity.ok(auditLogService.getEmployeeActivityLogs(employeeId));
    }
}