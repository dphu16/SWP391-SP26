package com.project.hrm.module.payroll.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.dto.RequestDTO.AssignBenefitRequest;
import com.project.hrm.module.payroll.dto.RequestDTO.BenefitRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.EmployeeBenefitResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.TotalRewardStatementDTO;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.BenefitType;
import com.project.hrm.module.payroll.enums.EmployeeBenefitStatus;
import com.project.hrm.module.payroll.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BenefitService Tests")
class BenefitServiceTest {

    @Mock private BenefitRepository benefitRepository;
    @Mock private EmployeeBenefitRepository employeeBenefitRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private PayslipRepository payslipRepository;
    @Mock private SalaryProfileRepository salaryProfileRepository;

    @InjectMocks
    private BenefitService benefitService;

    private UUID employeeId;
    private UUID benefitId;
    private Employee employee;
    private Benefit benefit;
    private SalaryProfile salaryProfile;
    
    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        benefitId = UUID.randomUUID();
        
        employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setFullName("Nguyễn Văn A");
        employee.setEmployeeCode("NV01");
        
        benefit = new Benefit();
        benefit.setBenefitId(benefitId);
        benefit.setName("Bảo hiểm sức khỏe Care");
        benefit.setBenefitType(BenefitType.HEALTH_CARE);
        benefit.setStandardValue(new BigDecimal("1500000"));
        benefit.setIsActive(true);
        
        salaryProfile = new SalaryProfile();
        salaryProfile.setBaseSalary(new BigDecimal("20000000"));
        salaryProfile.setTaxCode("TAX");
        salaryProfile.setInsuranceCode("INS");
    }

    @Test
    @DisplayName("Create Benefit - Success")
    void testCreateBenefit() {
        BenefitRequest request = new BenefitRequest();
        request.setName("Phụ cấp ăn trưa");
        request.setBenefitType(BenefitType.ALLOWANCE);
        request.setStandardValue(new BigDecimal("700000"));

        when(benefitRepository.save(any(Benefit.class))).thenAnswer(i -> {
            Benefit b = i.getArgument(0);
            b.setBenefitId(UUID.randomUUID());
            return b;
        });

        Benefit result = benefitService.createBenefit(request);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Phụ cấp ăn trưa");
        assertThat(result.getBenefitType()).isEqualTo(BenefitType.ALLOWANCE);
        verify(benefitRepository, times(1)).save(any(Benefit.class));
    }

    @Test
    @DisplayName("Assign Benefit To Employee - Success")
    void testAssignBenefitToEmployee() {
        AssignBenefitRequest request = new AssignBenefitRequest();
        request.setEmployeeId(employeeId);
        request.setBenefitId(benefitId);
        request.setStartDate(LocalDate.now());

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(benefitRepository.findById(benefitId)).thenReturn(Optional.of(benefit));
        when(employeeBenefitRepository.save(any(EmployeeBenefit.class))).thenAnswer(i -> {
            EmployeeBenefit eb = i.getArgument(0);
            eb.setId(UUID.randomUUID());
            return eb;
        });

        EmployeeBenefitResponse response = benefitService.assignBenefitToEmployee(request);

        assertThat(response).isNotNull();
        assertThat(response.getBenefitName()).isEqualTo("Bảo hiểm sức khỏe Care");
        assertThat(response.getStatus()).isEqualTo(EmployeeBenefitStatus.ACTIVE.name());
    }

    @Test
    @DisplayName("Get Total Reward Statement - Success")
    void testGetTotalRewardStatement() {
        int year = 2025;
        
        // 1. Mock Employee & SalaryProfile
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
                
        // 2. Mock Payslips (2 months)
        Payslip p1 = new Payslip();
        PayrollPeriod pr1 = new PayrollPeriod(); pr1.setYear(year); p1.setPeriod(pr1);
        p1.setGrossSalary(new BigDecimal("20000000"));
        p1.setTotalAllowances(new BigDecimal("500000")); // Cash Allowance
        p1.setTaxAmount(new BigDecimal("1000000"));
        p1.setInsuranceAmount(new BigDecimal("500000"));
        
        Payslip p2 = new Payslip();
        p2.setPeriod(pr1);
        p2.setGrossSalary(new BigDecimal("20000000"));
        p2.setTotalAllowances(new BigDecimal("500000"));
        p2.setTaxAmount(new BigDecimal("1000000"));
        p2.setInsuranceAmount(new BigDecimal("500000"));
        
        when(payslipRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId))
                .thenReturn(List.of(p1, p2));
                
        // 3. Mock Setup Non-Cash Benefits
        EmployeeBenefit eb = new EmployeeBenefit();
        eb.setBenefit(benefit); // NON-CASH (HEALTH_CARE : 1,500,000)
        eb.setAppliedValue(null);
        eb.setStartDate(LocalDate.of(year, 1, 1)); // Active full year
        eb.setStatus(EmployeeBenefitStatus.ACTIVE);
        when(employeeBenefitRepository.findActiveBenefitsForPeriod(eq(employeeId), any(), any()))
                .thenReturn(List.of(eb));

        // Act
        TotalRewardStatementDTO result = benefitService.getTotalRewardStatement(employeeId, year);
        
        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getEmployeeName()).isEqualTo("Nguyễn Văn A");
        assertThat(result.getTotalGrossSalary()).isEqualByComparingTo("40000000"); // 20M x 2
        assertThat(result.getTotalCashAllowances()).isEqualByComparingTo("1000000"); // 500k x 2
        assertThat(result.getTotalNonCashBenefitsValue()).isEqualByComparingTo("1500000"); // 1.5M standard value (annual lump sum)
        
        // Grand Total = Gross (40) + NonCash (1.5) = 41.5M
        assertThat(result.getGrandTotalRewardValue()).isEqualByComparingTo("41500000");
    }
}
