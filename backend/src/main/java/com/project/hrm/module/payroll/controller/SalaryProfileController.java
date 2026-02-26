package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.CreateSalaryProfileRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.SalaryProfileResponse;
import com.project.hrm.module.payroll.service.SalaryProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/salary-profiles")
@RequiredArgsConstructor
public class SalaryProfileController {
    private final SalaryProfileService service;

    @PostMapping("/initial")
    public ResponseEntity<SalaryProfileResponse> createInitialProfile(
            @RequestBody CreateSalaryProfileRequest request) {

        return ResponseEntity.ok(service.createInitialSalaryProfile(request));
    }

    @PostMapping("/increase")
    public ResponseEntity<SalaryProfileResponse> increaseSalary(
            @RequestParam UUID employeeId,
            @RequestParam BigDecimal newSalary,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate effectiveFrom) {

        return ResponseEntity.ok(
                service.increaseSalary(employeeId, newSalary, effectiveFrom)
        );
    }

    @GetMapping("/active/{employeeId}")
    public ResponseEntity<SalaryProfileResponse> getActiveProfile(
            @PathVariable UUID employeeId) {

        return service.getActiveProfile(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


}

