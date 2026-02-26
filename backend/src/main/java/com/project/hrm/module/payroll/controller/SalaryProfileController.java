package com.project.hrm.module.payroll.controller;

<<<<<<< HEAD:backend/src/main/java/com/project/hrm/module/payroll/compensation/controller/SalaryProfileController.java
import com.project.hrm.module.payroll.compensation.dto.RequestDTO.CreateSalaryProfileRequest;
import com.project.hrm.module.payroll.compensation.dto.ResponseDTO.SalaryProfileResponse;
import com.project.hrm.module.payroll.compensation.service.SalaryProfileService;
import com.project.hrm.payroll.compensation.dto.RequestDTO.CreateSalaryProfileRequest;
import com.project.hrm.payroll.compensation.dto.ResponseDTO.SalaryProfileResponse;
import com.project.hrm.payroll.compensation.service.SalaryProfileService;
import com.project.hrm.module.payroll.dto.RequestDTO.CreateSalaryProfileRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.SalaryProfileResponse;
import com.project.hrm.module.payroll.service.SalaryProfileService;
=======
import com.project.hrm.module.payroll.dto.RequestDTO.CreateSalaryProfileRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.SalaryProfileResponse;
import com.project.hrm.module.payroll.service.SalaryProfileService;
>>>>>>> df05727451ef27a28699bbdee957247d77b96b1d:backend/src/main/java/com/project/hrm/module/payroll/controller/SalaryProfileController.java
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

