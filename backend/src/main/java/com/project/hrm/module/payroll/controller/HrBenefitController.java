package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.AssignBenefitRequest;
import com.project.hrm.module.payroll.dto.RequestDTO.BenefitRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.EmployeeBenefitResponse;
import com.project.hrm.module.payroll.entity.Benefit;
import com.project.hrm.module.payroll.service.BenefitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/benefits")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrBenefitController {

    private final BenefitService benefitService;

    @PostMapping
    public ResponseEntity<Benefit> createBenefit(@Valid @RequestBody BenefitRequest request) {
        return ResponseEntity.ok(benefitService.createBenefit(request));
    }

    @GetMapping
    public ResponseEntity<Page<Benefit>> getAllBenefits(Pageable pageable) {
        return ResponseEntity.ok(benefitService.getAllBenefits(pageable));
    }

    @PostMapping("/assign")
    public ResponseEntity<EmployeeBenefitResponse> assignBenefitToEmployee(
            @Valid @RequestBody AssignBenefitRequest request) {
        return ResponseEntity.ok(benefitService.assignBenefitToEmployee(request));
    }
}
