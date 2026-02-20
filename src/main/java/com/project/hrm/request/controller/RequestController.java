package com.project.hrm.request.controller;

import com.project.hrm.request.dto.RequestDTO;
import com.project.hrm.request.entity.Request;
import com.project.hrm.request.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests") // Đã đổi URL ra ngang hàng với attendance
@RequiredArgsConstructor
public class RequestController {

    private final RequestService service;

    @PostMapping
    public ResponseEntity<Request> createRequest(@RequestBody RequestDTO dto) {
        return ResponseEntity.ok(service.createRequest(dto));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<Request>> getMyRequests(@RequestParam UUID employeeId) {
        return ResponseEntity.ok(service.getMyRequests(employeeId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Request> approveRequest(@PathVariable UUID id, @RequestBody(required = false) RequestDTO dto) {
        return ResponseEntity.ok(service.approveRequest(id, dto));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Request> rejectRequest(@PathVariable UUID id, @RequestBody RequestDTO dto) {
        return ResponseEntity.ok(service.rejectRequest(id, dto));
    }
}