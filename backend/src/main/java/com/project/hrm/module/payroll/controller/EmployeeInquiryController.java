package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.dto.RequestDTO.CreateInquiryRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.InquiryResponseDTO;
import com.project.hrm.module.payroll.service.EmployeeInquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employee/inquiries")
@RequiredArgsConstructor
public class EmployeeInquiryController {

    private final EmployeeInquiryService inquiryService;
    private final EmployeeRepository employeeRepository;

    /**
     * Lấy employeeId từ SecurityContext thay vì hardcode.
     */
    private UUID getCurrentEmployeeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Employee employee = employeeRepository.findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));

        return employee.getEmployeeId();
    }

    /**
     * API 1: Gửi thắc mắc mới
     * POST /api/v1/employee/inquiries
     */
    @PostMapping
    public ResponseEntity<InquiryResponseDTO> createInquiry(
            @Valid @RequestBody CreateInquiryRequest request) {

        UUID employeeId = getCurrentEmployeeId();
        return ResponseEntity.ok(inquiryService.createInquiry(employeeId, request));
    }

    /**
     * API 2: Xem lịch sử thắc mắc
     * GET /api/v1/employee/inquiries
     */
    @GetMapping
    public ResponseEntity<Page<InquiryResponseDTO>> getMyInquiries(Pageable pageable) {
        UUID employeeId = getCurrentEmployeeId();
        return ResponseEntity.ok(inquiryService.getMyInquiries(employeeId, pageable));
    }
}
