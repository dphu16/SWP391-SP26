package com.project.hrm.payroll.compensation.controller;


import com.project.hrm.common.auth.security.CustomUserPrincipal;
import com.project.hrm.payroll.compensation.dto.RequestDTO.CreateInquiryRequest;
import com.project.hrm.payroll.compensation.dto.ResponseDTO.InquiryResponse;
import com.project.hrm.payroll.compensation.service.SalaryInquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class SalaryInquiryController {

    private final SalaryInquiryService inquiryService;

    @PostMapping
    public ResponseEntity<InquiryResponse> create(
            @RequestBody CreateInquiryRequest request,
            Authentication authentication
    ) {
        UUID employeeId = extractEmployeeId(authentication);
        return ResponseEntity.ok(
                inquiryService.createInquiry(employeeId, request)
        );
    }

    @GetMapping("/my")
    public ResponseEntity<List<InquiryResponse>> getMy(
            Authentication authentication
    ) {
        UUID employeeId = extractEmployeeId(authentication);
        return ResponseEntity.ok(
                inquiryService.getMyInquiries(employeeId)
        );
    }

    private UUID extractEmployeeId(Authentication authentication) {
        CustomUserPrincipal principal =
                (CustomUserPrincipal) authentication.getPrincipal();
        return principal.getEmployeeId();
    }
}
