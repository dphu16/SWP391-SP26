package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.PaymentRequestDTO;
import com.project.hrm.module.payroll.dto.ResponseDTO.ApprovalResponseDTO;
import com.project.hrm.module.payroll.entity.PaymentRequest;
import com.project.hrm.module.payroll.service.FinanceService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
@CrossOrigin(origins = "*") // Adjust this for your React app's domain
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    // --- Endpoints for HR ---
    @PostMapping("/api/finance/requests")
    public ResponseEntity<?> createRequestOld(@RequestBody PaymentRequestDTO dto) {
        try {
            PaymentRequest request = financeService.createPaymentRequest(dto);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // --- Endpoints for Finance UI (/api/v1/finance) ---

    // 1. Get List of Payment Requests
    @GetMapping({ "/api/v1/finance/payment-requests", "/api/finance/requests/pending" })
    public ResponseEntity<List<PaymentRequest>> getPaymentRequests(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(financeService.getRequestsByStatus(status));
        }
        return ResponseEntity.ok(financeService.getAllRequests());
    }

    // 2. Approve and Execute Payment
    @PostMapping("/api/v1/finance/payment-requests/{id}/approve-and-execute")
    public ResponseEntity<?> approveAndExecutePayment(
            @PathVariable("id") UUID id,
            @RequestBody ApprovalResponseDTO dto) {
        try {
            dto.setRequestId(id);
            String result = financeService.approveAndExecutePayment(dto);
            return ResponseEntity.ok().body("{\"message\": \"" + result + "\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // 3. Reject Payment Request
    @PostMapping("/api/v1/finance/payment-requests/{id}/reject")
    public ResponseEntity<?> rejectPaymentRequest(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> payload) {
        try {
            String note = payload.get("financeNote");
            financeService.rejectPaymentRequest(id, note);
            return ResponseEntity.ok().body("{\"message\": \"Rejected successfully\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // 4. Get Payment Batches (History)
    @GetMapping("/api/v1/finance/payment-batches")
    public ResponseEntity<?> getPaymentBatches(@PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(financeService.getPaymentBatches(pageable));
    }

    // 5. Get Payment Transactions for a Batch
    @GetMapping("/api/v1/finance/payment-batches/{id}/transactions")
    public ResponseEntity<?> getPaymentTransactions(
            @PathVariable("id") UUID id,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(financeService.getPaymentTransactions(id, pageable));
    }

    // 6. Get Finance Accounts
    @GetMapping({ "/api/v1/finance/accounts", "/api/finance/accounts" })
    public ResponseEntity<?> getFinanceAccounts() {
        return ResponseEntity.ok(financeService.getAllAccounts());
    }
}
