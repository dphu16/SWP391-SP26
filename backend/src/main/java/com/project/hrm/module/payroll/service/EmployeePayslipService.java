package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.PayslipDetailDTO;
import com.project.hrm.module.payroll.dto.PayslipSummaryDTO;
import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.entity.PayrollPeriod;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeePayslipService {

        private final PayslipRepository payslipRepository;

        @PersistenceContext
        private EntityManager entityManager;

        // Cho phép xem tất cả status (bao gồm DRAFT để dễ test)
        private static final List<PayslipStatus> VISIBLE_STATUSES = List.of(
                        PayslipStatus.DRAFT, PayslipStatus.CONFIRMED, PayslipStatus.PAID);

        /**
         * Lấy danh sách lịch sử lương (native query, cast status::text)
         */
        @Transactional(readOnly = true)
        public Page<PayslipSummaryDTO> getMyPayslips(UUID employeeId, Pageable pageable) {
                return payslipRepository.findPayslipsWithPeriod(employeeId, VISIBLE_STATUSES, pageable)
                                .map(this::mapToSummaryDto);
        }

        /**
         * Xem chi tiết một phiếu lương
         */
        @Transactional(readOnly = true)
        public PayslipDetailDTO getPayslipDetail(UUID employeeId, UUID payslipId) {
                Payslip payslip = payslipRepository.findByIdAndEmployeeId(payslipId, employeeId)
                                .orElseThrow(() -> new RuntimeException("Payslip not found or access denied"));

                return mapToDetailDto(payslip);
        }

        // --- Helper Mappers ---

        private PayslipSummaryDTO mapToSummaryDto(Payslip p) {
                String period = "N/A";
                // Native query không tự fetch PayrollPeriod → cần load lazy hoặc manual
                try {
                        PayrollPeriod pp = p.getPayrollPeriod();
                        if (pp != null) {
                                period = pp.getMonth() + "/" + pp.getYear();
                        }
                } catch (Exception e) {
                        // Nếu LazyInitException, dùng fallback
                        period = "N/A";
                }

                return PayslipSummaryDTO.builder()
                                .payslipId(p.getPayslipId())
                                .period(period)
                                .netSalary(p.getNetSalary())
                                .status(p.getStatus())
                                .paidAt(p.getPaidAt() != null ? p.getPaidAt().toLocalDate() : null)
                                .build();
        }

        private PayslipDetailDTO mapToDetailDto(Payslip p) {
                // Map các dòng chi tiết (items)
                List<PayslipDetailDTO.PayslipItemDto> items = List.of();
                if (p.getDetails() != null) {
                        items = p.getDetails().stream()
                                        .map(d -> PayslipDetailDTO.PayslipItemDto.builder()
                                                        .itemName(d.getItemName())
                                                        .amount(d.getAmount())
                                                        .type(d.getType() != null && d.getType() == 1 ? "INCOME"
                                                                        : "DEDUCTION")
                                                        .build())
                                        .collect(Collectors.toList());
                }

                Integer month = null;
                Integer year = null;
                java.time.LocalDate startDate = null;
                java.time.LocalDate endDate = null;
                try {
                        PayrollPeriod pp = p.getPayrollPeriod();
                        if (pp != null) {
                                month = pp.getMonth();
                                year = pp.getYear();
                                startDate = pp.getStartDate();
                                endDate = pp.getEndDate();
                        }
                } catch (Exception e) {
                        // ignore lazy init
                }

                return PayslipDetailDTO.builder()
                                .payslipId(p.getPayslipId())
                                .month(month)
                                .year(year)
                                .startDate(startDate)
                                .endDate(endDate)
                                .baseSalary(p.getBaseSalary())
                                .totalAllowances(p.getTotalAllowances())
                                .grossSalary(p.getGrossSalary())
                                .taxAmount(p.getTaxAmount())
                                .insuranceAmount(p.getInsuranceAmount())
                                .totalDeductions(p.getTotalDeductions())
                                .netSalary(p.getNetSalary())
                                .status(p.getStatus())
                                .paidAt(p.getPaidAt() != null ? p.getPaidAt().toLocalDate() : null)
                                .items(items)
                                .build();
        }
}
