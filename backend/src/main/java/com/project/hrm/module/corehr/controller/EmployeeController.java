package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeSelfUpdateDTO;
import com.project.hrm.module.corehr.dto.response.ContractResponseDTO;

import com.project.hrm.module.corehr.dto.response.FieldCooldownDTO;
import com.project.hrm.module.corehr.service.directory.ContractService;
import com.project.hrm.module.corehr.service.directory.DependentService;
import com.project.hrm.module.corehr.service.directory.EmployeeSelfUpdateService;
import com.project.hrm.module.corehr.service.directory.IEmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final DependentService dependentService;
    private final com.project.hrm.module.corehr.service.AuditLogService auditLogService;

    public EmployeeController(IEmployeeService employeeService,
                              EmployeeSelfUpdateService selfUpdateService,
                              ContractService contractService,
                              DependentService dependentService,
                              com.project.hrm.module.corehr.service.AuditLogService auditLogService) {
        this.employeeService = employeeService;
        this.selfUpdateService = selfUpdateService;
        this.contractService = contractService;
        this.dependentService = dependentService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/hr/employees")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Page<EmployeeDTO>> getAllEmployees(
            @PageableDefault(size = 10, sort = "fullName") Pageable pageable) {
        Page<EmployeeDTO> result = employeeService.searchEmployees(null, null, null, null, null, null, "OFFICIAL",
                pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("employee/{id}/view-detail")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'INTERN', 'PROBATION')")
    public ResponseEntity<EmployeeDetailDTO> getEmployeeDetail(
            @PathVariable("id") UUID id) {

        EmployeeDetailDTO dto = employeeService.getEmployeeDetail(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/employees/{id}/edit")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<EmployeeDetailDTO> updateEmployee(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EmployeeChangeDTO req) {
        EmployeeDetailDTO updated = employeeService.updateEmployee(id, req);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/employees/search")
    public ResponseEntity<Page<EmployeeDTO>> searchEmployees(
            @RequestParam(value = "fullName",     required = false) String fullName,
            @RequestParam(value = "employeeCode", required = false) String employeeCode,
            @RequestParam(value = "phoneNumber",  required = false) String phoneNumber,
            @RequestParam(value = "department",   required = false) String department,
            @RequestParam(value = "position",     required = false) String position,
            @RequestParam(value = "role",         required = false) String role,
            @RequestParam(value = "status",       required = false) String status,
            @PageableDefault(size = 10, sort = "fullName") Pageable pageable) {

        if (phoneNumber != null && !phoneNumber.matches("^[0-9\\-\\s]+$")) {
            throw new IllegalArgumentException("Phone number contains invalid characters.");
        }

        Page<EmployeeDTO> result = employeeService.searchEmployees(
                fullName, employeeCode, phoneNumber, department, position, role, status, pageable);
        return ResponseEntity.ok(result);
    }

    // BRD 2.5: Employee views own profile
    @GetMapping("/employee/profile")
    public ResponseEntity<EmployeeDetailDTO> getMyProfile(
            @RequestAttribute("employeeId") UUID employeeId) {
        EmployeeDetailDTO dto = employeeService.getEmployeeDetail(employeeId);
        return ResponseEntity.ok(dto);
    }

    // BRD 2.2: Employee self-update (phone, email, address) with 6-month cooldown
    @PutMapping("/employees/self-update")
    @PreAuthorize("isAuthenticated()") // Cho phép tất cả nhân viên được authenticated tự cập nhật profile của mình
    public ResponseEntity<EmployeeDetailDTO> selfUpdate(
            @RequestAttribute("employeeId") UUID employeeId,
            @RequestBody EmployeeSelfUpdateDTO dto) {
        EmployeeDetailDTO updated = selfUpdateService.selfUpdate(employeeId, dto);
        return ResponseEntity.ok(updated);
    }

    // BRD 2.2: Get cooldown status for employee's editable fields
    @GetMapping("/employees/{id}/cooldowns")
    public ResponseEntity<List<FieldCooldownDTO>> getCooldowns(
            @PathVariable("id") UUID employeeId) {
        return ResponseEntity.ok(selfUpdateService.getCooldowns(employeeId));
    }

    // BRD 2.3: Get contracts for an employee
    @GetMapping("/employees/{id}/contracts")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<ContractResponseDTO>> getEmployeeContracts(
            @PathVariable("id") UUID employeeId) {
        return ResponseEntity.ok(contractService.getContractsByEmployee(employeeId));
    }

    // BRD 2.3: Get contracts expiring within 30 days
    @GetMapping("/contracts/expiring")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<ContractResponseDTO>> getExpiringContracts() {
        return ResponseEntity.ok(contractService.getExpiringContracts());
    }

    // Get Employee Activity Logs
    @GetMapping("/employees/{id}/activity-logs")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<com.project.hrm.module.corehr.dto.response.AuditLogResponseDTO>> getEmployeeActivityLogs(
            @PathVariable("id") UUID employeeId) {
        return ResponseEntity.ok(auditLogService.getEmployeeActivityLogs(employeeId));
    }
}