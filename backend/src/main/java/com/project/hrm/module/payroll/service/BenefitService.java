package com.project.hrm.module.payroll.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.dto.RequestDTO.AssignBenefitRequest;
import com.project.hrm.module.payroll.dto.RequestDTO.BenefitRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.EmployeeBenefitResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.TotalRewardStatementDTO;
import com.project.hrm.module.payroll.entity.Benefit;
import com.project.hrm.module.payroll.entity.EmployeeBenefit;
import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.enums.BenefitType;
import com.project.hrm.module.payroll.enums.EmployeeBenefitStatus;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.BenefitRepository;
import com.project.hrm.module.payroll.repository.EmployeeBenefitRepository;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BenefitService {

    private final BenefitRepository benefitRepository;
    private final EmployeeBenefitRepository employeeBenefitRepository;
    private final EmployeeRepository employeeRepository;
    private final PayslipRepository payslipRepository;

    @Transactional
    public Benefit createBenefit(BenefitRequest request) {
        Benefit benefit = Benefit.builder()
                .name(request.getName())
                .description(request.getDescription())
                .benefitType(request.getBenefitType())
                .standardValue(request.getStandardValue())
                .isActive(true)
                .build();
        return benefitRepository.save(benefit);
    }

    public Page<Benefit> getAllBenefits(Pageable pageable) {
        return benefitRepository.findAll(pageable);
    }

    @Transactional
    public EmployeeBenefitResponse assignBenefitToEmployee(AssignBenefitRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        Benefit benefit = benefitRepository.findById(request.getBenefitId())
                .orElseThrow(() -> new ResourceNotFoundException("Benefit not found"));

        EmployeeBenefit eb = EmployeeBenefit.builder()
                .employee(employee)
                .benefit(benefit)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(EmployeeBenefitStatus.ACTIVE)
                .appliedValue(request.getAppliedValue())
                .build();

        eb = employeeBenefitRepository.save(eb);

        return EmployeeBenefitResponse.builder()
                .employeeBenefitId(eb.getId())
                .benefitId(benefit.getBenefitId())
                .benefitName(benefit.getName())
                .benefitType(benefit.getBenefitType())
                .startDate(eb.getStartDate())
                .endDate(eb.getEndDate())
                .appliedValue(eb.getAppliedValue())
                .status(eb.getStatus().name())
                .build();
    }

    @Transactional(readOnly = true)
    public TotalRewardStatementDTO getTotalRewardStatement(UUID employeeId, int year) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // 1. Get all payslips for the year
        LocalDate startOfYear = LocalDate.of(year, 1, 1);
        LocalDate endOfYear = LocalDate.of(year, 12, 31);
        
        // Assuming we fetch all payslips and filter in memory for simplicity, 
        // in a real app you'd want a specific query for this.
        List<Payslip> allPayslips = payslipRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId);
        List<Payslip> yearPayslips = new ArrayList<>();
        for (Payslip p : allPayslips) {
            if (p.getPeriod().getYear() == year) {
                yearPayslips.add(p);
            }
        }

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalInsurance = BigDecimal.ZERO;
        BigDecimal totalCashAllowances = BigDecimal.ZERO;

        for (Payslip p : yearPayslips) {
            totalGross = totalGross.add(p.getGrossSalary() != null ? p.getGrossSalary() : BigDecimal.ZERO);
            totalNet = totalNet.add(p.getNetSalary() != null ? p.getNetSalary() : BigDecimal.ZERO);
            totalTax = totalTax.add(p.getTaxAmount() != null ? p.getTaxAmount() : BigDecimal.ZERO);
            totalInsurance = totalInsurance.add(p.getInsuranceAmount() != null ? p.getInsuranceAmount() : BigDecimal.ZERO);
            totalCashAllowances = totalCashAllowances.add(p.getTotalAllowances() != null ? p.getTotalAllowances() : BigDecimal.ZERO);
        }

        // 2. Get active NON-CASH benefits for the year (e.g., Health Care, Gym)
        List<EmployeeBenefit> activeBenefits = employeeBenefitRepository.findActiveBenefitsForPeriod(employeeId, startOfYear, endOfYear);
        
        BigDecimal totalNonCashValue = BigDecimal.ZERO;
        List<TotalRewardStatementDTO.BenefitItemDTO> benefitItems = new ArrayList<>();

        for (EmployeeBenefit eb : activeBenefits) {
            if (eb.getBenefit().getBenefitType() != BenefitType.ALLOWANCE) {
                BigDecimal value = eb.getAppliedValue() != null ? eb.getAppliedValue() : eb.getBenefit().getStandardValue();
                if (value != null) {
                    // Approximate value for the year based on months active.
                    // For simplicity, we just add the standard value assuming it's an annual value,
                    // but a robust implementation would prorate this based on start/end dates.
                    totalNonCashValue = totalNonCashValue.add(value);
                    
                    benefitItems.add(TotalRewardStatementDTO.BenefitItemDTO.builder()
                            .benefitName(eb.getBenefit().getName())
                            .benefitType(eb.getBenefit().getBenefitType().name())
                            .calculatedValue(value)
                            .build());
                }
            }
        }

        // 3. Calculate Grand Total
        // Net Salary + Tax Paid (Value to employee) + Insurance Paid + Non-Cash Benefits
        BigDecimal grandTotal = totalGross.add(totalNonCashValue);

        return TotalRewardStatementDTO.builder()
                .employeeName(employee.getFullName())
                .employeeCode(employee.getEmployeeCode())
                .period("Year " + year)
                .totalGrossSalary(totalGross)
                .totalNetSalary(totalNet)
                .totalCashAllowances(totalCashAllowances)
                .totalTaxPaid(totalTax)
                .totalInsurancePaid(totalInsurance)
                .totalNonCashBenefitsValue(totalNonCashValue)
                .benefitItems(benefitItems)
                .grandTotalRewardValue(grandTotal)
                .build();
    }
}
