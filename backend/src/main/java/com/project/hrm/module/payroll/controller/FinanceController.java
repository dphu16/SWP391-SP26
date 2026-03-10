package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.PaymentRequestDTO;
import com.project.hrm.module.payroll.dto.ResponseDTO.ApprovalResponseDTO;
import com.project.hrm.module.payroll.entity.PaymentRequest;
import com.project.hrm.module.payroll.service.FinanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "*") // Adjust this for your React app's domain
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    // Endpoint for HR
    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody PaymentRequestDTO dto) {
        try {
            PaymentRequest request = financeService.createPaymentRequest(dto);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Endpoint for Finance UI - View Pending
    @GetMapping("/requests/pending")
    public ResponseEntity<List<PaymentRequest>> getPendingRequests() {
        return ResponseEntity.ok(financeService.getPendingRequests());
    }

    // Endpoint for Finance UI - Approve
    @PostMapping("/requests/approve")
    public ResponseEntity<?> approvePayment(@RequestBody ApprovalResponseDTO dto) {
        try {
            String result = financeService.approveAndExecutePayment(dto);
            return ResponseEntity.ok().body("{\"message\": \"" + result + "\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
