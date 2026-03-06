package com.project.hrm.module.request.controller;

import com.project.hrm.module.request.dto.RequestDTO;
import com.project.hrm.module.request.dto.RequestResponseDTO;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Đảm bảo React có thể gọi API nếu khác port
public class RequestController {

    private final RequestService service;

    // --- 1. LẤY TẤT CẢ ĐƠN (MANAGER) ---
    // Endpoint này trả về RequestResponseDTO đã có sẵn employeeName và deptName
    @GetMapping("/all")
    public ResponseEntity<List<RequestResponseDTO>> getAllRequests() {
        return ResponseEntity.ok(service.getAllRequestsForReview());
    }

    // --- 2. DUYỆT ĐƠN (APPROVE) ---
    @PutMapping("/{id}/approve")
    public ResponseEntity<Request> approveRequest(
            @PathVariable UUID id,
            @RequestBody(required = false) RequestDTO dto) {
        return ResponseEntity.ok(service.approveRequest(id, dto));
    }

    // --- 3. TỪ CHỐI ĐƠN (REJECT) ---
    @PutMapping("/{id}/reject")
    public ResponseEntity<Request> rejectRequest(
            @PathVariable UUID id,
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
    public ResponseEntity<List<Request>> getMyRequests(@RequestParam UUID employeeId) {
        return ResponseEntity.ok(service.getMyRequests(employeeId));
    }

    /**
     * Nhân viên sửa đơn (Chỉ được sửa khi đơn đang PENDING)
     */
    @PutMapping("/{id}")
    public ResponseEntity<Request> updateRequest(
            @PathVariable UUID id,
            @RequestBody RequestDTO requestDTO) {
        return ResponseEntity.ok(service.updateRequest(id, requestDTO));
    }

    /**
     * Nhân viên rút/xóa đơn (Chỉ được xóa khi đơn đang PENDING)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRequest(@PathVariable UUID id) {
        service.deleteRequest(id);
        return ResponseEntity.ok("Xóa đơn thành công!");
    }
}