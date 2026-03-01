package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.PayrollReviewDTO;
import com.project.hrm.module.payroll.dto.RequestDTO.UpdatePayrollDetailRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.TaxInsuranceDTO;
import com.project.hrm.module.payroll.service.PayrollReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hr/payroll-review")
@RequiredArgsConstructor
public class PayrollReviewController {

    private final PayrollReviewService reviewService;

    /**
     * 1. Lấy dữ liệu review của 1 Batch
     * GET /api/v1/hr/payroll-review/{batchId}
     */
    @GetMapping("/{batchId}")
    public ResponseEntity<List<PayrollReviewDTO>> getBatchDetails(@PathVariable("batchId") UUID batchId) {
        return ResponseEntity.ok(reviewService.getBatchDetailsForReview(batchId));
    }

    /**
     * 2. Sửa đổi thủ công 1 dòng lương
     * PUT /api/v1/hr/payroll-review/details/{detailId}
     */
    @PutMapping("/details/{detailId}")
    public ResponseEntity<String> updateDetail(
            @PathVariable("detailId") UUID detailId,
            @RequestBody UpdatePayrollDetailRequest request) {

        reviewService.updatePayrollDetail(detailId, request);
        return ResponseEntity.ok("Updated successfully");
    }

    /**
     * 3. Phê duyệt (Validate) Batch -> Chuyển sang trạng thái VALIDATED
     * POST /api/v1/hr/payroll-review/{batchId}/approve
     */
    @PostMapping("/{batchId}/approve")
    public ResponseEntity<String> approveBatch(@PathVariable("batchId") UUID batchId) {

        reviewService.validateAndApproveBatch(batchId);
        return ResponseEntity.ok("Batch validated and approved successfully.");
    }

    /**
     * 4. Gửi báo cáo (Send Report) -> Chuyển sang trạng thái LOCKED
     * POST /api/v1/hr/payroll-review/{batchId}/send-report
     */
    @PostMapping("/{batchId}/send-report")
    public ResponseEntity<String> sendReport(@PathVariable("batchId") UUID batchId) {
        reviewService.sendReport(batchId);
        return ResponseEntity.ok("Report sent successfully and batch is locked.");
    }

    /**
     * 5. Lấy báo cáo Thuế & Bảo hiểm (Tax & Insurance)
     * GET /api/v1/hr/payroll-review/{batchId}/tax-insurance
     */
    @GetMapping("/{batchId}/tax-insurance")
    public ResponseEntity<List<TaxInsuranceDTO>> getTaxAndInsuranceReport(@PathVariable("batchId") UUID batchId) {
        return ResponseEntity.ok(reviewService.getTaxAndInsuranceReport(batchId));
    }
}