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
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(employeeService.getAllEmployees(pageable));
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

}
