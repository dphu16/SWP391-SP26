package com.project.hrm.module.payroll.controller;



import com.project.hrm.module.payroll.dto.RequestDTO.PayrollReviewDTO;
import com.project.hrm.module.payroll.dto.RequestDTO.UpdatePayrollDetailRequest;
import com.project.hrm.module.payroll.service.PayrollReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hr/payroll-review")
@RequiredArgsConstructor
public class PayrollReviewController {

    private final PayrollReviewService reviewService;

    // 1. Lấy dữ liệu review của 1 Batch
    // GET /api/v1/hr/payroll-review/{batchId}
    @GetMapping("/{batchId}")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public ResponseEntity<List<PayrollReviewDTO>> getBatchDetails(@PathVariable UUID batchId) {
        return ResponseEntity.ok(reviewService.getBatchDetailsForReview(batchId));
    }

    // 2. Sửa đổi thủ công 1 dòng lương (Nếu phát hiện sai)
    // PUT /api/v1/hr/payroll-review/details/{detailId}
    @PutMapping("/details/{detailId}")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public ResponseEntity<String> updateDetail(
            @PathVariable UUID detailId,
            @RequestBody UpdatePayrollDetailRequest request) {

        reviewService.updatePayrollDetail(detailId, request);
        return ResponseEntity.ok("Updated successfully");
    }

    // 3. Phê duyệt (Validate) Batch -> Chuyển sang trạng thái VALIDATED
    // POST /api/v1/hr/payroll-review/{batchId}/approve
    @PostMapping("/{batchId}/approve")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public ResponseEntity<String> approveBatch(@PathVariable UUID batchId) {

        reviewService.validateAndApproveBatch(batchId);
        return ResponseEntity.ok("Batch validated and approved successfully.");
    }
}
