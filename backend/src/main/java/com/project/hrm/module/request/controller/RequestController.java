package com.project.hrm.module.request.controller;

import com.project.hrm.module.request.dto.RequestDTO;
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
public class RequestController {

    private final RequestService service;

    // 1. Tạo đơn mới (Employee)
    @PostMapping
    public ResponseEntity<Request> createRequest(@RequestBody RequestDTO dto) {
        // Service đã có @Transactional nên sẽ insert thật vào DB
        return ResponseEntity.ok(service.createRequest(dto));
    }

    // 2. Xem đơn của tôi (Employee)
    @GetMapping("/my-requests")
    public ResponseEntity<List<Request>> getMyRequests(@RequestParam UUID employeeId) {
        return ResponseEntity.ok(service.getMyRequests(employeeId));
    }

    // 3. Xem tất cả đơn (Manager)
    @GetMapping("/all")
    public ResponseEntity<List<Request>> getAllRequests() {
        return ResponseEntity.ok(service.getAllRequests());
    }

    // 4. Duyệt đơn (Manager)
    @PutMapping("/{id}/approve")
    public ResponseEntity<Request> approveRequest(
            @PathVariable UUID id,
            @RequestBody(required = false) RequestDTO dto) {
        return ResponseEntity.ok(service.approveRequest(id, dto));
    }

    // 5. Từ chối đơn (Manager)
    @PutMapping("/{id}/reject")
    public ResponseEntity<Request> rejectRequest(
            @PathVariable UUID id,
            @RequestBody(required = false) RequestDTO dto) {
        return ResponseEntity.ok(service.rejectRequest(id, dto));
    }

    // 6. Cập nhật đơn (Employee)
    @PutMapping("/{id}")
    public ResponseEntity<Request> updateRequest(
            @PathVariable UUID id,
            @RequestBody RequestDTO dto) {
        return ResponseEntity.ok(service.updateRequest(id, dto));
    }

    // 7. Xóa đơn (Employee)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable UUID id) {
        service.deleteRequest(id);
        return ResponseEntity.noContent().build();
    }
}