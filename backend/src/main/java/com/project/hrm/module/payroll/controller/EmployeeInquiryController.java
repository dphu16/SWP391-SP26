package com.project.hrm.module.payroll.controller;



import com.project.hrm.module.payroll.dto.RequestDTO.CreateInquiryRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.InquiryResponseDTO;
import com.project.hrm.module.payroll.service.EmployeeInquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employee/inquiries")
@RequiredArgsConstructor
public class EmployeeInquiryController {

    private final EmployeeInquiryService inquiryService;

    // Giả lập ID user đang đăng nhập
    private UUID getCurrentEmployeeId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
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
