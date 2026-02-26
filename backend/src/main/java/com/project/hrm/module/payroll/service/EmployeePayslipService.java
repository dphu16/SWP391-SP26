package com.project.hrm.module.payroll.service;


import com.project.hrm.module.payroll.dto.PayslipDetailDTO;
import com.project.hrm.module.payroll.dto.PayslipSummaryDTO;
import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeePayslipService {

    private final PayslipRepository payslipRepository;

    // Các trạng thái employee được phép xem
    private static final List<PayslipStatus> VISIBLE_STATUSES = List.of(
            PayslipStatus.CONFIRMED,
            PayslipStatus.PAID
    );

    /**
     * Lấy danh sách lịch sử lương
     */
    @Transactional(readOnly = true)
    public Page<PayslipSummaryDTO> getMyPayslips(UUID employeeId, Pageable pageable) {
        return payslipRepository.findByEmployee_EmployeeIdAndStatusIn(employeeId, VISIBLE_STATUSES, pageable)
                .map(this::mapToSummaryDto);
    }

    /**
     * Xem chi tiết một phiếu lương
     */
    @Transactional(readOnly = true)
    public PayslipDetailDTO getPayslipDetail(UUID employeeId, UUID payslipId) {
        Payslip payslip = payslipRepository.findByIdAndEmployeeId(payslipId, employeeId)
                .orElseThrow(() -> new RuntimeException("Payslip not found or access denied"));

        if (!VISIBLE_STATUSES.contains(payslip.getStatus())) {
            throw new RuntimeException("Payslip is not ready to view");
        }

        return mapToDetailDto(payslip);
    }

    // --- Helper Mappers ---

    private PayslipSummaryDTO mapToSummaryDto(Payslip p) {
        return PayslipSummaryDTO.builder()
                .payslipId(p.getPayslipId())
                .period(p.getPayrollPeriod().getMonth() + "/" + p.getPayrollPeriod().getYear())
                .netSalary(p.getNetSalary())
                .status(p.getStatus())
                .paidAt(p.getPaidAt() != null ? p.getPaidAt().toLocalDate() : null)
                .build();
    }

    private PayslipDetailDTO mapToDetailDto(Payslip p) {
        // Map các dòng chi tiết (items)
        List<PayslipDetailDTO.PayslipItemDto> items = p.getDetails().stream()
                .map(d -> PayslipDetailDTO.PayslipItemDto.builder()
                        .itemName(d.getItemName())
                        .amount(d.getAmount())
                        .type(d.getType() == 1 ? "INCOME" : "DEDUCTION") // 1: Thu nhập, 2: Khấu trừ
                        .build())
                .collect(Collectors.toList());

        return PayslipDetailDTO.builder()
                .payslipId(p.getPayslipId())
                .month(p.getPayrollPeriod().getMonth())
                .year(p.getPayrollPeriod().getYear())
                .startDate(p.getPayrollPeriod().getStartDate())
                .endDate(p.getPayrollPeriod().getEndDate())
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
