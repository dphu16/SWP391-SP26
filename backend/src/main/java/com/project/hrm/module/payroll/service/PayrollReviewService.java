package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.RequestDTO.PayrollReviewDTO;
import com.project.hrm.module.payroll.dto.RequestDTO.UpdatePayrollDetailRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.TaxInsuranceDTO;
import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.entity.PayrollDetail;
import com.project.hrm.module.payroll.entity.Payslip;
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
    private final PayrollCalculationService payrollCalculationService;
    private final com.project.hrm.module.payroll.repository.PayslipRepository payslipRepository;

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
        // Chỉ chặn khi batch đã được VALIDATE hoặc LOCKED (đã chốt sổ)
        // Cho phép edit khi DRAFT hoặc PROCESSED (đã tính lương nhưng chưa approve)
        if (batch.getStatus() == BatchStatus.VALIDATED || batch.getStatus() == BatchStatus.LOCKED) {
            throw new RuntimeException(
                    "Cannot edit a validated or locked batch. The payroll has already been approved.");
        }

        // Cập nhật các trường HR chỉnh sửa
        boolean needsRecalculation = false;

        if (request.getTotalOtHours() != null) {
            detail.setTotalOtHours(request.getTotalOtHours());
            needsRecalculation = true;
        }

        if (request.getTotalAbsentDays() != null) {
            detail.setTotalAbsentDays(request.getTotalAbsentDays());
            needsRecalculation = true;
        }

        if (needsRecalculation) {
            com.project.hrm.module.payroll.entity.Payslip payslip = payslipRepository
                    .findByEmployee_EmployeeIdAndPayrollPeriod_MonthAndPayrollPeriod_Year(
                            detail.getEmployee().getEmployeeId(),
                            batch.getPeriod().getMonthValue(),
                            batch.getPeriod().getYear())
                    .stream().findFirst().orElse(null);

            if (payslip != null) {
                payrollCalculationService.recalculateDetailValues(detail, payslip.getTotalAllowances());
                // Nếu bị override gross salary sau cùng thì ta để sau này
            }
        }

        // Nếu HR sửa trực tiếp Gross Salary (Override)
        if (request.getGrossSalaryAdjustment() != null) {
            detail.setGrossSalary(request.getGrossSalaryAdjustment());
            // Net sẽ phải tính lại theo con số override
            payrollCalculationService.recalculateTaxesAndNet(detail);
        }

        detailRepository.save(detail);

        // Re-update payslip nếu tìm update
        if (needsRecalculation || request.getGrossSalaryAdjustment() != null) {
            com.project.hrm.module.payroll.entity.Payslip payslip = payslipRepository
                    .findByEmployee_EmployeeIdAndPayrollPeriod_MonthAndPayrollPeriod_Year(
                            detail.getEmployee().getEmployeeId(),
                            batch.getPeriod().getMonthValue(),
                            batch.getPeriod().getYear())
                    .stream().findFirst().orElse(null);

            if (payslip != null) {
                payrollCalculationService.recalculatePayslipValues(payslip, detail);
                payslipRepository.save(payslip);
            }
        }
    }

    /**
     * 3. Validate & Approve Batch (Chốt số liệu)
     * Chuyển trạng thái từ DRAFT -> VALIDATED
     */
    @Transactional
    public void validateAndApproveBatch(UUID batchId) {
        PayrollBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        // Chỉ cho phép approve batch ở trạng thái DRAFT hoặc PROCESSED
        if (batch.getStatus() == BatchStatus.VALIDATED) {
            throw new RuntimeException("Batch đã được approve trước đó (status: VALIDATED).");
        }
        if (batch.getStatus() == BatchStatus.LOCKED) {
            throw new RuntimeException("Batch đã bị khoá (status: LOCKED), không thể thay đổi.");
        }

        // Kiểm tra logic toàn bộ batch trước khi approve
        List<PayrollDetail> details = detailRepository.findByPayrollBatch_BatchId(batchId);

        if (details.isEmpty()) {
            throw new RuntimeException("Batch chưa có dữ liệu lương. Vui lòng tính lương trước khi approve.");
        }

        boolean hasCriticalError = details.stream()
                .anyMatch(d -> d.getGrossSalary() != null && d.getGrossSalary().compareTo(BigDecimal.ZERO) < 0); // Lương
        // âm

        if (hasCriticalError) {
            throw new RuntimeException("Validation Failed: Found negative salary records.");
        }

        // Chuyển trạng thái sang VALIDATED
        batch.setStatus(BatchStatus.VALIDATED);
        batchRepository.save(batch);
    }

    /**
     * 4. Gửi báo cáo (Send Report)
     * Chuyển trạng thái từ VALIDATED -> LOCKED
     */
    @Transactional
    public void sendReport(UUID batchId) {
        PayrollBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        if (batch.getStatus() == BatchStatus.DRAFT || batch.getStatus() == BatchStatus.PROCESSED) {
            throw new RuntimeException("Chưa thể gửi báo cáo. Vui lòng Validate & Approve batch trước.");
        }
        if (batch.getStatus() == BatchStatus.LOCKED) {
            throw new RuntimeException("Báo cáo đã được gửi và batch đã bị khoá.");
        }

        // Chuyển trạng thái sang LOCKED
        batch.setStatus(BatchStatus.LOCKED);
        batchRepository.save(batch);
    }

    /**
     * 5. Lấy báo cáo Thuế & Bảo hiểm cho Batch
     */
    @Transactional(readOnly = true)
    public List<TaxInsuranceDTO> getTaxAndInsuranceReport(UUID batchId) {
        PayrollBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        if (batch.getPeriod() == null) {
            throw new RuntimeException("Batch period is null");
        }

        // Fetch payslips for the month/year of this batch
        // Here we use employee_id, month, year if periodId is not available, or we just
        // rely on the new method
        // finding the period associated with the batch
        // Actually, we can just find payslips by month and year.
        // Better: We can just use the details from this batch and look up their
        // payslips.
        List<PayrollDetail> details = detailRepository.findByPayrollBatch_BatchId(batchId);

        return details.stream().map(d -> {
            // Find payslip for this employee in this month
            Payslip payslip = payslipRepository.findByEmployee_EmployeeIdAndPayrollPeriod_MonthAndPayrollPeriod_Year(
                    d.getEmployee().getEmployeeId(),
                    batch.getPeriod().getMonthValue(),
                    batch.getPeriod().getYear()).stream().findFirst().orElse(null);

            BigDecimal gross = payslip != null ? payslip.getGrossSalary() : d.getGrossSalary();
            BigDecimal base = payslip != null ? payslip.getBaseSalary() : d.getBaseSalary();
            BigDecimal totalIns = payslip != null ? payslip.getInsuranceAmount() : BigDecimal.ZERO;
            BigDecimal pit = payslip != null ? payslip.getTaxAmount() : BigDecimal.ZERO;
            BigDecimal net = payslip != null ? payslip.getNetSalary() : d.getNetSalary();
            BigDecimal totalDeduct = totalIns.add(pit);

            // Calculate the 8%, 1.5%, 1% from the 10.5% total insurance based on base
            // salary
            BigDecimal bhxh = base.multiply(BigDecimal.valueOf(0.08));
            BigDecimal bhyt = base.multiply(BigDecimal.valueOf(0.015));
            BigDecimal bhtn = base.multiply(BigDecimal.valueOf(0.01));

            String deptName = "";
            if (d.getEmployee().getDepartment() != null) {
                deptName = d.getEmployee().getDepartment().getDeptName();
            }

            return TaxInsuranceDTO.builder()
                    .employeeId(d.getEmployee().getEmployeeId())
                    .employeeName(d.getEmployee().getFullName())
                    .department(deptName)
                    .grossSalary(gross)
                    .baseSalary(base)
                    .bhxh(bhxh)
                    .bhyt(bhyt)
                    .bhtn(bhtn)
                    .totalIns(totalIns)
                    .pit(pit)
                    .totalDeduct(totalDeduct)
                    .netSalary(net)
                    .build();
        }).collect(Collectors.toList());
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
        if (d.getTotalAbsentDays() != null && d.getTotalAbsentDays().compareTo(BigDecimal.ZERO) > 0) {
            warning = true;
            msg = msg.isEmpty() ? "Absent Days Warning" : msg + " | Absent Days Warning";
        }

        // Lấy department name an toàn
        String deptName = "";
        try {
            if (d.getEmployee().getDepartment() != null) {
                deptName = d.getEmployee().getDepartment().getDeptName();
            }
        } catch (Exception e) {
            deptName = "";
        }

        return PayrollReviewDTO.builder()
                .detailId(d.getPayrollId())
                .employeeId(d.getEmployee().getEmployeeId())
                .employeeName(d.getEmployee().getFullName() != null ? d.getEmployee().getFullName() : "N/A")
                .department(deptName)
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
