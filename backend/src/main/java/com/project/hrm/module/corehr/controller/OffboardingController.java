package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.CancelOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.HRConfirmOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.OffboardingRequestDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.dto.response.OffboardingResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.service.offboarding.IOffboardingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class OffboardingController {

    private final IOffboardingService offboardingService;
    private final EmployeeRepository employeeRepository;

    public OffboardingController(IOffboardingService offboardingService,
            EmployeeRepository employeeRepository) {
        this.offboardingService = offboardingService;
        this.employeeRepository = employeeRepository;
    }

    // ── BRD 3.1: Nhân viên tự tạo yêu cầu nghỉ việc (voluntary resignation) ──
    @PostMapping("/offboarding/resign/{employeeId}")
    public ResponseEntity<OffboardingResponseDTO> createResignationRequest(
            @PathVariable("employeeId") UUID employeeId,
            @Valid @RequestBody OffboardingRequestDTO dto) {
        // In local development, trust current employeeId or pass it as requester
        OffboardingResponseDTO response = offboardingService.createResignationRequest(employeeId, dto, employeeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── BRD 3.1: Quản lý đề xuất sa thải / hết HĐ / không vào làm ──
    @PostMapping("/offboarding/propose/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<OffboardingResponseDTO> createManagerProposedRequest(
            @PathVariable("employeeId") UUID employeeId,
            @Valid @RequestBody OffboardingRequestDTO dto) {
        UUID managerId = getCurrentEmployeeId();
        OffboardingResponseDTO response = offboardingService.createManagerProposedRequest(employeeId, dto, managerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── BRD 3.1: Quản lý duyệt yêu cầu nghỉ tự nguyện ──
    @PutMapping("/offboarding/{offboardingId}/manager-approve")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<OffboardingResponseDTO> managerApprove(
            @PathVariable("offboardingId") UUID offboardingId) {
        UUID managerId = getCurrentEmployeeId();
        OffboardingResponseDTO response = offboardingService.managerApprove(offboardingId, managerId);
        return ResponseEntity.ok(response);
    }

    // ── BRD 3.1 + 3.4: HR điền ngày nghỉ chính thức & xác nhận ──
    @PutMapping("/offboarding/{offboardingId}/hr-confirm")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<OffboardingResponseDTO> hrConfirm(
            @PathVariable("offboardingId") UUID offboardingId,
            @Valid @RequestBody HRConfirmOffboardingDTO dto) {
        UUID hrEmployeeId = getCurrentEmployeeId();
        OffboardingResponseDTO response = offboardingService.hrConfirm(offboardingId, dto, hrEmployeeId);
        return ResponseEntity.ok(response);
    }

    // ── BRD 3.2: Hủy yêu cầu offboarding ──
    @PutMapping("/offboarding/{offboardingId}/cancel")
    public ResponseEntity<OffboardingResponseDTO> cancelOffboarding(
            @PathVariable("offboardingId") UUID offboardingId,
            @Valid @RequestBody CancelOffboardingDTO dto) {
        UUID cancelledBy = getCurrentEmployeeId(); // Or extract from security
        if (cancelledBy == null) {
            // fallback: in some testing modes, allow cancel
            cancelledBy = offboardingId;
        }
        OffboardingResponseDTO response = offboardingService.cancelOffboarding(offboardingId, dto, cancelledBy);
        return ResponseEntity.ok(response);
    }

    // ── Query: Lấy tất cả request đang active ──
    @GetMapping("/offboarding/active")
    @PreAuthorize("hasAnyRole('HR','MANAGER','EMPLOYEE','INTERN','PROBATION')")
    public ResponseEntity<List<OffboardingResponseDTO>> getActiveRequests() {
        return ResponseEntity.ok(offboardingService.getActiveRequests());
    }

    // ── Query: Lấy request PENDING (chờ Manager duyệt) ──
    @GetMapping("/offboarding/pending")
    @PreAuthorize("hasAnyRole('HR','MANAGER')")
    public ResponseEntity<List<OffboardingResponseDTO>> getPendingRequests() {
        return ResponseEntity.ok(offboardingService.getPendingRequests());
    }

    // ── Query: Chi tiết 1 offboarding request ──
    @GetMapping("/offboarding/{offboardingId}")
    @PreAuthorize("hasAnyRole('HR','MANAGER','EMPLOYEE','INTERN','PROBATION')")
    public ResponseEntity<OffboardingResponseDTO> getOffboardingById(
            @PathVariable("offboardingId") UUID offboardingId) {
        return ResponseEntity.ok(offboardingService.getOffboardingById(offboardingId));
    }

    // ── Legacy endpoints ──

    @PutMapping("/employees/{id}/terminate")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<EmployeeDetailDTO> terminateEmployee(
            @PathVariable("id") UUID id) {
        EmployeeDetailDTO updated = offboardingService.terminateEmployee(id);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/employees/{id}/activate")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<EmployeeDetailDTO> activateEmployee(
            @PathVariable("id") UUID id) {
        EmployeeDetailDTO updated = offboardingService.activateEmployee(id);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/employees/inactive")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<InactiveEmployeeResponseDTO>> getInactiveEmployees() {
        List<InactiveEmployeeResponseDTO> inactiveList = offboardingService.getInactiveEmployees();
        return ResponseEntity.ok(inactiveList);
    }

    // ── Helper: Resolve current user's employee ID from JWT ──
    private UUID getCurrentEmployeeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Current user not authenticated");
        }
        return employeeRepository.findByUser_Email(auth.getName())
                .map(Employee::getEmployeeId)
                .orElse(null); // Return null instead of aborting wildly if not found
    }
}
