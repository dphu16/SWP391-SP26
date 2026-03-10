package com.project.hrm.module.payroll.controller;

import com.project.hrm.module.payroll.dto.RequestDTO.PayrollBatchDTO;
import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.enums.BatchStatus;
import com.project.hrm.module.payroll.repository.PayrollBatchRepository;
import com.project.hrm.module.payroll.service.PayrollCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.project.hrm.module.payroll.dto.ResponseDTO.InquiryResponseDTO;
import com.project.hrm.module.payroll.service.EmployeeInquiryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/v1/hr/payroll")
@RequiredArgsConstructor
public class HrPayrollController {

    private final PayrollCalculationService payrollService;
    private final PayrollBatchRepository batchRepository;
    private final EmployeeInquiryService employeeInquiryService;

    /**
     * Lấy toàn bộ danh sách thắc mắc cho HR
     * GET /api/v1/hr/payroll/inquiries
     */
    @GetMapping("/inquiries")
    public ResponseEntity<Page<InquiryResponseDTO>> getAllInquiries(Pageable pageable) {
        return ResponseEntity.ok(employeeInquiryService.getAllInquiries(pageable));
    }

    /**
     * Cập nhật trạng thái thắc mắc
     * PUT /api/v1/hr/payroll/inquiries/{id}/status?status=IN_PROGRESS
     */
    @PutMapping("/inquiries/{id}/status")
    public ResponseEntity<InquiryResponseDTO> updateInquiryStatus(
            @PathVariable("id") UUID inquiryId,
            @RequestParam("status") com.project.hrm.module.payroll.enums.InquiryStatus status) {
        return ResponseEntity.ok(employeeInquiryService.updateInquiryStatus(inquiryId, status));
    }

    /**
     * GET /api/v1/hr/payroll/batches
     * Lấy danh sách tất cả PayrollBatch, sắp xếp mới nhất lên đầu
     */
    @GetMapping("/batches")
    public ResponseEntity<List<PayrollBatchDTO>> getAllBatches() {
        List<PayrollBatchDTO> result = batchRepository.findAll().stream()
                .sorted(Comparator.comparing(PayrollBatch::getPeriod).reversed())
                .map(b -> new PayrollBatchDTO(
                        b.getBatchId(),
                        b.getPeriod(),
                        b.getStatus() != null ? b.getStatus().name() : "UNKNOWN",
                        b.getCreatedAt(),
                        b.getProcessedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/v1/hr/payroll/batches
     * Tạo mới một PayrollBatch cho tháng/năm chỉ định
     * Body: { "month": 2, "year": 2026 }
     */
    @PostMapping("/batches")
    public ResponseEntity<PayrollBatchDTO> createBatch(@RequestBody Map<String, Integer> body) {
        int month = body.getOrDefault("month", LocalDate.now().getMonthValue());
        int year = body.getOrDefault("year", LocalDate.now().getYear());

        LocalDate period = LocalDate.of(year, month, 1);

        // Tạo batch mới
        PayrollBatch batch = new PayrollBatch();
        batch.setPeriod(period);
        batch.setStatus(BatchStatus.DRAFT);
        batch.setCreatedAt(LocalDateTime.now());
        PayrollBatch saved = batchRepository.save(batch);

        PayrollBatchDTO dto = new PayrollBatchDTO(
                saved.getBatchId(),
                saved.getPeriod(),
                saved.getStatus().name(),
                saved.getCreatedAt(),
                saved.getProcessedAt());
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /api/v1/hr/payroll/calculate/{batchId}
     * Kích hoạt tính lương cho một đợt (Batch)
     */
    @PostMapping("/calculate/{batchId}")
    public ResponseEntity<String> calculatePayroll(@PathVariable("batchId") UUID batchId) {
        payrollService.calculatePayrollForBatch(batchId);
        return ResponseEntity.ok("Payroll calculation completed successfully.");
    }
}
