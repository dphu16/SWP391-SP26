package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.CancelOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.HRConfirmOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.OffboardingRequestDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.dto.response.OffboardingResponseDTO;
import com.project.hrm.module.corehr.service.offboarding.IOffboardingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class OffboardingController {

    private final IOffboardingService offboardingService;
    
    public OffboardingController(IOffboardingService offboardingService) {
        this.offboardingService = offboardingService;
    }

    // ── BRD 3.1: Nhân viên tự tạo yêu cầu nghỉ việc (voluntary resignation) ──
    @PostMapping("/offboarding/resign/{employeeId}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<OffboardingResponseDTO> createResignationRequest(
            @PathVariable("employeeId") UUID employeeId,
            @RequestAttribute("employeeId") UUID tokenEmployeeId,
            @Valid @RequestBody OffboardingRequestDTO dto) {
        // Sử dụng ID từ token để ngăn chặn IDOR, giữ PathVariable để đảm bảo API contract (backward compatibility)
        OffboardingResponseDTO response = offboardingService.createResignationRequest(tokenEmployeeId, dto, tokenEmployeeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── BRD 3.1: Quản lý đề xuất sa thải / hết HĐ / không vào làm ──
    @PostMapping("/offboarding/propose/{employeeId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<OffboardingResponseDTO> createManagerProposedRequest(
            @PathVariable("employeeId") UUID employeeId,
            @RequestAttribute("employeeId") UUID requesterId,
            @Valid @RequestBody OffboardingRequestDTO dto) {
        OffboardingResponseDTO response = offboardingService.createManagerProposedRequest(employeeId, dto, requesterId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── BRD 3.1: Quản lý duyệt yêu cầu nghỉ tự nguyện ──
    @PutMapping("/offboarding/{offboardingId}/manager-approve")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<OffboardingResponseDTO> managerApprove(
            @PathVariable("offboardingId") UUID offboardingId,
            @RequestAttribute("employeeId") UUID managerId) {
        OffboardingResponseDTO response = offboardingService.managerApprove(offboardingId, managerId);
        return ResponseEntity.ok(response);
    }

    // ── BRD 3.1 + 3.4: HR điền ngày nghỉ chính thức & xác nhận ──
    @PutMapping("/offboarding/{offboardingId}/hr-confirm")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<OffboardingResponseDTO> hrConfirm(
            @PathVariable("offboardingId") UUID offboardingId,
            @RequestAttribute("employeeId") UUID hrEmployeeId,
            @Valid @RequestBody HRConfirmOffboardingDTO dto) {
        OffboardingResponseDTO response = offboardingService.hrConfirm(offboardingId, dto, hrEmployeeId);
        return ResponseEntity.ok(response);
    }

    // ── BRD 3.2: Hủy yêu cầu offboarding ──
    @PutMapping("/offboarding/{offboardingId}/cancel")
    public ResponseEntity<OffboardingResponseDTO> cancelOffboarding(
            @PathVariable("offboardingId") UUID offboardingId,
            @RequestAttribute("employeeId") UUID cancelledBy,
            @Valid @RequestBody CancelOffboardingDTO dto) {
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
    @PreAuthorize("hasRole('MANAGER')")
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


}
