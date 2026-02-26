package com.project.hrm.module.payroll.compensation.repository;

import com.project.hrm.module.payroll.compensation.entity.Payslip;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.payroll.compensation.dto.ResponseDTO.PayslipDetailResponse;
import com.project.hrm.payroll.compensation.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PayslipRepository extends JpaRepository<Payslip, UUID> {
    List<Payslip> findByEmployeeId(UUID employeeId);

    List<Payslip> findByPeriodId(UUID periodId);

    Boolean existsByEmployeeIdAndPeriodId(UUID employeeId, UUID periodId);

    //tim payslip
    Optional<Payslip> findByPayslipIdAndEmployeeId(UUID payslipId, UUID employeeId);

    //bao cao luong
    @Query("""
    SELECT 
        COUNT(p),
        SUM(CASE WHEN p.status = 'PAID' THEN 1 ELSE 0 END),
        SUM(CASE WHEN p.status = 'CONFIRMED' THEN 1 ELSE 0 END),
        SUM(p.grossSalary),
        SUM(p.totalDeductions),
        SUM(p.netSalary)
    FROM Payslip p
    WHERE p.periodId = :periodId
      AND p.status IN ('CONFIRMED', 'PAID')
""")
    Object[] getPayrollSummary(UUID periodId);

    // tong hop luong theo nam
    @Query("""
    SELECT 
        SUM(p.grossSalary),
        SUM(p.totalDeductions),
        SUM(p.netSalary)
    FROM Payslip p
    JOIN PayrollPeriods pp ON p.payslipId = pp.periodId
    WHERE p.status IN ('CONFIRMED', 'PAID')
      AND YEAR(pp.startDate) = :year
""")
    Object[] getYearlySummary(int year);

    //tong hop luong theo thang
    @Query("""
    SELECT 
        SUM(p.grossSalary),
        SUM(p.totalDeductions),
        SUM(p.netSalary)
    FROM Payslip p
    JOIN PayrollPeriods pp ON p.payslipId = pp.periodId
    WHERE p.status IN ('CONFIRMED', 'PAID')
      AND YEAR(pp.startDate) = :year
      AND MONTH(pp.startDate) = :month
""")
    Object[] getMonthlySummary(int year, int month);
}
