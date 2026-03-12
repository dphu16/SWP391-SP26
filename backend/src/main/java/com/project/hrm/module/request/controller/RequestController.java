package com.project.hrm.module.request.controller;

import com.project.hrm.module.request.dto.RequestDTO;
import com.project.hrm.module.request.dto.RequestResponseDTO;
import com.project.hrm.module.request.entity.LeaveBalance;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class RequestController {

    private final RequestService service;

    // --- 1. LẤY TẤT CẢ ĐƠN (MANAGER) ---
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<List<RequestResponseDTO>> getAllRequests() {
        return ResponseEntity.ok(service.getAllRequestsForReview());
    }

    // --- 2. DUYỆT ĐƠN (APPROVE) ---
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Request> approveRequest(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) RequestDTO dto) {
        return ResponseEntity.ok(service.approveRequest(id, dto));
    }

    // --- 3. TỪ CHỐI ĐƠN (REJECT) ---
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Request> rejectRequest(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) RequestDTO dto) {
        return ResponseEntity.ok(service.rejectRequest(id, dto));
    }

    // --- 4. TẠO ĐƠN MỚI (EMPLOYEE) ---
    @PostMapping
    public ResponseEntity<Request> createRequest(@RequestBody RequestDTO dto) {
        return ResponseEntity.ok(service.createRequest(dto));
    }

    // --- 5. XEM ĐƠN CÁ NHÂN (EMPLOYEE) ---
    @GetMapping("/my-requests")
    public ResponseEntity<List<Request>> getMyRequests(@RequestParam("employeeId") UUID employeeId) {
        return ResponseEntity.ok(service.getMyRequests(employeeId));
    }

    // --- 6. XÓA ĐƠN (EMPLOYEE) ---
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable("id") UUID id) {
        service.deleteRequest(id);
        return ResponseEntity.noContent().build();
    }

    // --- 7. XEM LEAVE BALANCE CỦA NHÂN VIÊN ---
    @GetMapping("/leave-balance")
    public ResponseEntity<LeaveBalance> getLeaveBalance(
            @RequestParam("employeeId") UUID employeeId,
            @RequestParam("year") int year) {
        return ResponseEntity.ok(service.getLeaveBalance(employeeId, year).orElse(null));
    }
}
