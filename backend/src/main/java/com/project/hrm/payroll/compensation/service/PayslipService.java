package com.project.hrm.payroll.compensation.service;

import com.project.hrm.payroll.common.enums.PayslipStatus;
import com.project.hrm.payroll.common.enums.PayslipType;
import com.project.hrm.payroll.compensation.dto.PayslipItemDTO;
import com.project.hrm.payroll.compensation.dto.ResponseDTO.PayslipDetailResponse;
import com.project.hrm.payroll.compensation.entity.Payslip;
import com.project.hrm.payroll.compensation.entity.PayslipDetail;
import com.project.hrm.payroll.compensation.repository.PayslipDetailRepository;
import com.project.hrm.payroll.compensation.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PayslipService {
    private final PayslipRepository payslipRepository;
    private final PayslipDetailRepository payslipDetailRepository;
    //Employee xem myPayslip
    public PayslipDetailResponse viewMyPayslip(UUID payslipId, UUID employeeId) {
        Payslip payslip = payslipRepository
                .findByPayslipIdAndEmployeeId(payslipId, employeeId)
                .orElseThrow(() -> new RuntimeException("Payslip not found"));

        if (payslip.getStatus() == PayslipStatus.DRAFT) {
            throw new RuntimeException("Payslip not available yet");
        }

        List<PayslipDetail> details =
                payslipDetailRepository.findByPayslipPayslipId(payslipId);

        List<PayslipItemDTO> incomes = details.stream()
                .filter(d -> d.getType() == PayslipType.INCOME)
                .map(d -> new PayslipItemDTO(d.getItemName(), d.getAmount()))
                .toList();

        List<PayslipItemDTO> deductions = details.stream()
                .filter(d -> d.getType() == PayslipType.DEDUCTION)
                .map(d -> new PayslipItemDTO(d.getItemName(), d.getAmount()))
                .toList();

        return PayslipDetailResponse.builder()
                .payslipId(payslip.getPayslipId())
                .baseSalary(payslip.getBaseSalary())
                .totalAllowances(payslip.getTotalAllowances())
                .grossSalary(payslip.getGrossSalary())
                .taxAmount(payslip.getTaxAmount())
                .insuranceAmount(payslip.getInsuranceAmount())
                .totalDeductions(payslip.getTotalDeductions())
                .netSalary(payslip.getNetSalary())
                .incomes(incomes)
                .deductions(deductions)
                .status(payslip.getStatus())
                .confirmedAt(payslip.getConfirmedAt())
                .paidAt(payslip.getPaidAt())
                .build();
    }
}
