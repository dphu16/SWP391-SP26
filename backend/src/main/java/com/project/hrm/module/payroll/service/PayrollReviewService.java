package com.project.hrm.module.payroll.service;



import com.project.hrm.module.payroll.dto.RequestDTO.PayrollReviewDTO;
import com.project.hrm.module.payroll.dto.RequestDTO.UpdatePayrollDetailRequest;
import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.entity.PayrollDetail;
import com.project.hrm.module.payroll.enums.BatchStatus;
import com.project.hrm.module.payroll.repository.PayrollBatchRepository;
import com.project.hrm.module.payroll.repository.PayrollDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollReviewService {

    private final PayrollBatchRepository batchRepository;
    private final PayrollDetailRepository detailRepository;

    /**
     * 1. Lấy danh sách chi tiết bảng lương để Review
     * Kèm theo logic phát hiện cảnh báo (Warning)
     */
    @Transactional(readOnly = true)
    public List<PayrollReviewDTO> getBatchDetailsForReview(UUID batchId) {
        List<PayrollDetail> details = detailRepository.findByPayrollBatch_BatchId(batchId);

        return details.stream().map(this::mapToReviewDto).collect(Collectors.toList());
    }

    /**
     * 2. HR sửa dữ liệu thủ công (Manual Adjustment)
     */
    @Transactional
    public void updatePayrollDetail(UUID detailId, UpdatePayrollDetailRequest request) {
        PayrollDetail detail = detailRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Detail not found"));

        PayrollBatch batch = detail.getPayrollBatch();
        if (batch.getStatus() == BatchStatus.LOCKED || batch.getStatus() == BatchStatus.PROCESSED) {
            throw new RuntimeException("Cannot edit a processed/locked batch");
        }

        // Cập nhật các trường HR chỉnh sửa
        if (request.getTotalOtHours() != null) {
            detail.setTotalOtHours(request.getTotalOtHours());
            // TODO: Recalculate OT Pay based on new hours (Logic tính toán lại nên đặt ở đây)
        }

        if (request.getTotalAbsentDays() != null) {
            detail.setTotalAbsentDays(request.getTotalAbsentDays());
            // TODO: Recalculate Absent Deduction
        }

        // Nếu HR sửa trực tiếp Gross Salary (Override)
        if (request.getGrossSalaryAdjustment() != null) {
            detail.setGrossSalary(request.getGrossSalaryAdjustment());
        }

        detailRepository.save(detail);
    }

    /**
     * 3. Validate & Approve Batch (Chốt số liệu)
     * Chuyển trạng thái từ DRAFT -> VALIDATED
     */
    @Transactional
    public void validateAndApproveBatch(UUID batchId) {
        PayrollBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        // Kiểm tra logic toàn bộ batch trước khi approve
        List<PayrollDetail> details = detailRepository.findByPayrollBatch_BatchId(batchId);

        boolean hasCriticalError = details.stream()
                .anyMatch(d -> d.getGrossSalary().compareTo(BigDecimal.ZERO) < 0); // Lương âm

        if (hasCriticalError) {
            throw new RuntimeException("Validation Failed: Found negative salary records.");
        }

        // Chuyển trạng thái
        batch.setStatus(BatchStatus.VALIDATED);
        // Set ngày khóa sổ (Locked At) nếu cần
        // batch.setLockedAt(LocalDateTime.now());

        batchRepository.save(batch);
    }

    // --- Helper ---
    private PayrollReviewDTO mapToReviewDto(PayrollDetail d) {
        boolean warning = false;
        String msg = "";

        // Logic cảnh báo đơn giản
        if (d.getGrossSalary() == null || d.getGrossSalary().compareTo(BigDecimal.ZERO) == 0) {
            warning = true;
            msg = "Zero Salary Warning";
        }
        if (d.getTotalOtHours() != null && d.getTotalOtHours().doubleValue() > 80) {
            warning = true;
            msg = "High OT Hours (>80)";
        }

        return PayrollReviewDTO.builder()
                .detailId(d.getPayrollId())
                .employeeId(d.getEmployee().getEmployeeId())
                .employeeName(d.getEmployee().getFullName()) // Giả sử có getFullName
                .baseSalary(d.getBaseSalary())
                .totalOtHours(d.getTotalOtHours())
                .otPay(d.getOtPay())
                .totalAbsentDays(d.getTotalAbsentDays())
                .absentDeduction(d.getAbsentDeduction())
                .grossSalary(d.getGrossSalary())
                .hasWarning(warning)
                .warningMessage(msg)
                .build();
    }
}
