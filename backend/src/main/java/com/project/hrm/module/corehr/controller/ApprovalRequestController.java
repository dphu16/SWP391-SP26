package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.ApprovalActionDTO;
import com.project.hrm.module.corehr.dto.response.ApprovalRequestResponseDTO;
import com.project.hrm.module.corehr.service.approval.ApprovalRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/employees")
public class ApprovalRequestController {

    private final ApprovalRequestService approvalRequestService;

    public ApprovalRequestController(ApprovalRequestService approvalRequestService) {
        this.approvalRequestService = approvalRequestService;
    }

    @PostMapping("/{employeeId}/approval-request")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApprovalRequestResponseDTO> createApprovalRequest(
            @PathVariable("employeeId") UUID employeeId) {

        ApprovalRequestResponseDTO response = approvalRequestService.createApprovalRequest(employeeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/approval-requests/{requestId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApprovalRequestResponseDTO> processApprovalRequest(
            @PathVariable("requestId") UUID requestId,
            @Valid @RequestBody ApprovalActionDTO actionDTO) {

        ApprovalRequestResponseDTO response = approvalRequestService.processApprovalRequest(requestId, actionDTO);
        return ResponseEntity.ok(response);
    }
}
