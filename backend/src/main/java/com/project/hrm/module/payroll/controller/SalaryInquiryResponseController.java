package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.ResponseDTO.CreateInquiryResponseDTO;
import com.project.hrm.module.payroll.entity.SalaryInquiryResponse;
import com.project.hrm.module.payroll.service.SalaryInquiryResponseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/salary-inquiries/responses")
@RequiredArgsConstructor
public class SalaryInquiryResponseController {

    private final SalaryInquiryResponseService responseService;

    @PostMapping
    public ResponseEntity<?> createResponse(@Valid @RequestBody CreateInquiryResponseDTO dto) {
        try {
            SalaryInquiryResponse savedResponse = responseService.createResponse(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedResponse);
        } catch (IllegalArgumentException e) {
            // Bắt lỗi thắc mắc đã có người trả lời
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi hệ thống!");
        }
    }
}
