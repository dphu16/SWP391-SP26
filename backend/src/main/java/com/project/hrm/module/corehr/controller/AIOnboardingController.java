package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.request.EditChatRequest;
import com.project.hrm.module.corehr.dto.request.ExtractedContractDTO;
import com.project.hrm.module.corehr.dto.response.*;
import com.project.hrm.module.corehr.service.AI.AIChatService;
import com.project.hrm.module.corehr.service.AI.ScanOrchestratorService;
import com.project.hrm.module.corehr.service.approval.ApprovalRequestService;
import com.project.hrm.module.corehr.service.onboarding.IOnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

import static org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIOnboardingController {

    private final ScanOrchestratorService scanOrchestratorService;
    private final AIChatService aiChatService;
    private final IOnboardingService onboardingService;
    private final ApprovalRequestService approvalRequestService;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SCAN CONTRACT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Scan hợp đồng lao động (PDF).
     *
     * Response gồm:
     * - extractedData : flat DTO để FE map vào form
     * - fields : từng field kèm confidence + colorHint + needsReview
     * - boundingBoxes : tọa độ chính xác (PDFBox) kèm colorHint để FE render
     * overlay
     * - fileBase64 : file gốc để FE render inline
     * - reviewCount : số field confidence < 50, FE hiển thị badge cảnh báo
     *
     * Màu highlight: GREEN(≥80) | YELLOW(50–79) | RED(<50)
     * File CHƯA lưu server — FE giữ fileBase64 + boundingBoxes đến khi HR confirm.
     */
    @PostMapping(value = "/scan-contract", consumes = MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ExtractedContractDTO> scan(
            @RequestParam("file") MultipartFile file) throws IOException {

        return ResponseEntity.ok(
                scanOrchestratorService.scan(file.getBytes(), file.getContentType()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. EDIT CHAT — chỉnh sửa extractedData qua ngôn ngữ tự nhiên
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * HR dùng câu lệnh tự nhiên để chỉnh sửa thông tin đã scan.
     *
     * Request:
     * {
     * "message": "sửa lương thành 20 triệu và phòng ban là Kế toán",
     * "currentData": { ... ExtractedContractDTO hiện tại ... }
     * }
     *
     * Response:
     * {
     * "updatedData" : { ... ExtractedContractDTO đã được update ... },
     * "confirmMessage" : "Đã cập nhật thành công:\n• Lương: 15000000 → 20000000\n•
     * Phòng ban: Kỹ thuật → Kế toán",
     * "changeSummary" : "• Lương: ...\n• Phòng ban: ...",
     * "success" : true
     * }
     *
     * FE replace state extractedData bằng updatedData và hiển thị confirmMessage
     * trong chat.
     */
    @PostMapping("/edit-chat")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<EditChatResponse> editChat(
            @RequestBody @Valid EditChatRequest request) {

        return ResponseEntity.ok(
                aiChatService.editExtractedData(request.getMessage(), request.getCurrentData()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CREATE AND SUBMIT — preview-only, không lưu file
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * HR confirm → tạo nhân viên + submit approval.
     * File không được lưu lên server — chỉ dùng để preview trên FE.
     */
    @PostMapping("/onboarding/create-and-submit")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<NewHireResponseDTO> createAndSubmit(
            @RequestBody @Valid CreateNewHireDTO dto) throws IOException {

        NewHireResponseDTO created = onboardingService.createNewHire(dto);
        UUID employeeId = created.getEmployeeId();

        approvalRequestService.createApprovalRequest(employeeId);
        return ResponseEntity.ok(created);
    }
}
