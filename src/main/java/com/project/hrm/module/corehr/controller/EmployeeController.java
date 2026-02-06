package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.EmployeeChangeRequestDTO;
import com.project.hrm.module.corehr.dto.EmployeeDTO;
import com.project.hrm.module.corehr.dto.JobDTO;
import com.project.hrm.module.corehr.dto.PersonalDTO;
import com.project.hrm.module.corehr.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class EmployeeController {
    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/hr/employees")
    public List<EmployeeDTO> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("employee/{id}/personal")
    public ResponseEntity<PersonalDTO> getPersonalInfo(@PathVariable UUID id) {
        PersonalDTO dto = employeeService.getPersonalById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("employee/{id}/job")
    public ResponseEntity<JobDTO> getJobInfo(@PathVariable UUID id) {
        JobDTO dto = employeeService.getJobById(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/employees/{id}/edit")
    public ResponseEntity<Void> updateSelf(@PathVariable  UUID id, @Valid @RequestBody EmployeeChangeRequestDTO req){
        employeeService.updateSelf(id, req);
        return ResponseEntity.ok().build();
    }
}
