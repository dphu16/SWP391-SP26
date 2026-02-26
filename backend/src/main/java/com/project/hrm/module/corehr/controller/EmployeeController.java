package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
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
import java.util.Set;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class EmployeeController {

    private static final Set<String> PRIVILEGED_ROLES = Set.of("ROLE_HR", "ROLE_MANAGER");

    private final IEmployeeService employeeService;
    private final EmployeeRepository employeeRepository;

    public EmployeeController(IEmployeeService employeeService,
            EmployeeRepository employeeRepository) {
        this.employeeService = employeeService;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping("/hr/employees")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Page<EmployeeDTO>> getAllEmployees(
            @PageableDefault(size = 10, sort = "fullName") Pageable pageable) {
        return ResponseEntity.ok(employeeService.getAllEmployees(pageable));
    }

    @GetMapping("employee/{id}/view-detail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EmployeeDetailDTO> getEmployeeDetail(
            @PathVariable("id") UUID id,
            Authentication authentication) {

        enforceOwnershipOrPrivilege(id, authentication);

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

    @GetMapping("/employees/user/hr")
    public ResponseEntity<List<EmployeeDTO>> getAllHr(){
        return ResponseEntity.ok(employeeService.getEmployeesByRole(UserRole.HR));
    }

    private void enforceOwnershipOrPrivilege(UUID targetEmployeeId, Authentication auth) {
        boolean isPrivileged = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(PRIVILEGED_ROLES::contains);

        if (isPrivileged)
            return;

        String currentUsername = auth.getName();
        Employee currentEmployee = employeeRepository.findByUser_Username(currentUsername)
                .orElseThrow(() -> new BusinessRuleException(
                        ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Employee profile not found for current user"));

        if (!currentEmployee.getEmployeeId().equals(targetEmployeeId)) {
            throw new BusinessRuleException(
                    ErrorCode.ACCESS_DENIED,
                    "You can only view your own profile");
        }
    }
}
