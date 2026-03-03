package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.service.directory.IEmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class EmployeeController {

    private final IEmployeeService employeeService;

    public EmployeeController(IEmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/hr/employees")
    public ResponseEntity<Page<EmployeeDTO>> getAllEmployees(
            @PageableDefault(size = 10, sort = "fullName") Pageable pageable) {
        Page<EmployeeDTO> result = employeeService.searchEmployees(null, null, null, null, null, null, "OFFICIAL",
                pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("employee/{id}/view-detail")
    public ResponseEntity<EmployeeDetailDTO> getEmployeeDetail(
            @PathVariable("id") UUID id) {

        EmployeeDetailDTO dto = employeeService.getEmployeeDetail(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/employees/{id}/edit")
    public ResponseEntity<EmployeeDetailDTO> updateEmployee(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EmployeeChangeDTO req) {
        EmployeeDetailDTO updated = employeeService.updateEmployee(id, req);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/employees/search")
    public ResponseEntity<Page<EmployeeDTO>> searchEmployees(
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "fullName") Pageable pageable) {

        if (phoneNumber != null && !phoneNumber.matches("^[0-9\\-\\s]+$")) {
            throw new IllegalArgumentException("Phone number contains invalid characters.");
        }

        Page<EmployeeDTO> result = employeeService.searchEmployees(fullName, employeeCode, phoneNumber, department,
                position, role, status, pageable);
        return ResponseEntity.ok(result);
    }
}
