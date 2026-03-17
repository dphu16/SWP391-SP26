package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.ResponseDTO.TotalRewardStatementDTO;
import com.project.hrm.module.payroll.service.BenefitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employee/benefits")
@RequiredArgsConstructor
public class EmployeeBenefitController {

    private final BenefitService benefitService;

    @GetMapping("/my-trs")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_HR', 'ROLE_FINANCE')")
    public ResponseEntity<TotalRewardStatementDTO> getMyTotalRewardStatement(
            @RequestAttribute("employeeId") UUID employeeId,
            @RequestParam(required = false) Integer year) {
        
        int targetYear = (year != null) ? year : LocalDate.now().getYear();
        
        return ResponseEntity.ok(
                benefitService.getTotalRewardStatement(employeeId, targetYear)
        );
    }
}
