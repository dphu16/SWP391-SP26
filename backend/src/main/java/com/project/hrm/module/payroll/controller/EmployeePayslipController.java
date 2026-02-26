package com.project.hrm.payroll.compensation.controller;

import com.project.hrm.payroll.compensation.dto.ResponseDTO.PayslipDetailResponse;
import com.project.hrm.common.auth.security.CustomUserPrincipal;
import com.project.hrm.payroll.compensation.service.PayslipService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/employee/payslips")
@RequiredArgsConstructor
public class EmployeePayslipController {

    private final PayslipService payslipService;

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<PayslipDetailResponse> viewPayslip(
            @PathVariable UUID id,
            Authentication authentication) {

        UUID employeeId = extractEmployeeId(authentication);

        return ResponseEntity.ok(
                payslipService.viewMyPayslip(id, employeeId)
        );
    }

    private UUID extractEmployeeId(Authentication authentication) {
        CustomUserPrincipal principal =
                (CustomUserPrincipal) authentication.getPrincipal();
        return principal.getEmployeeId();
    }
}
