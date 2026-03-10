package com.project.hrm.module.recruitment.controller;

import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.recruitment.dto.response.DepartmentResponse;
import com.project.hrm.module.recruitment.dto.response.EmployeeResponse;
import com.project.hrm.module.recruitment.dto.response.PositionResponse;
import com.project.hrm.module.recruitment.service.EDPService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/edp")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class EDPController {
    private final EDPService edpService;

    @GetMapping("/hr")
    public ResponseEntity<List<EmployeeResponse>> getAllHr() {

        List<EmployeeResponse> responses = edpService.getEmployeeByRole(UserRole.HR);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/dept")
    public ResponseEntity<List<DepartmentResponse>> getAllDepartment() {

        List<DepartmentResponse> responses = edpService.getAllDepartment();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/dept/manager/{id}")
    public ResponseEntity<DepartmentResponse> getDepartmentByManager(
            @PathVariable UUID id) {

        DepartmentResponse responses = edpService.getDepartmentByManagerId(id);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/pos/{id}")
    public ResponseEntity<List<PositionResponse>> getPositionByDeptId(
            @PathVariable UUID id) {

        List<PositionResponse> responses = edpService.getPositionByDeptId(id);

        return ResponseEntity.ok(responses);
    }

}
