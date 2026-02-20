package com.project.hrm.request.controller;

import com.project.hrm.attendance.dto.RequestDTO;
import com.project.hrm.request.entity.Request;
import com.project.hrm.request.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService service;

    // 1. Tạo yêu cầu (Employee)
    @PostMapping
    public ResponseEntity<Request> createRequest(@RequestBody RequestDTO dto) {
        return ResponseEntity.ok(service.createRequest(dto));
    }

    // 2. Xem lịch sử (Employee)
    @GetMapping("/my-requests")
    public ResponseEntity<List<Request>> getMyRequests(@RequestParam UUID employeeId) {
        return ResponseEntity.ok(service.getMyRequests(employeeId));
    }

    // 3. Duyệt / Từ chối (Manager)
    @PutMapping("/{id}/status")
    public ResponseEntity<Request> updateStatus(@PathVariable UUID id, @RequestBody RequestDTO dto) {
        return ResponseEntity.ok(service.updateStatus(id, dto));
    }
}