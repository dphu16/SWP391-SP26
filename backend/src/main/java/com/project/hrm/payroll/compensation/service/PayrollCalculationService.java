package com.project.hrm.payroll.compensation.service;

import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.payroll.compensation.dto.ResponseDTO.PayrollResultDTO;
import com.project.hrm.payroll.compensation.entity.SalaryProfile;
import com.project.hrm.payroll.compensation.repository.SalaryProfileRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class PayrollCalculationService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceLogRepository attendanceRepository;
    private final SalaryProfileRepository salaryProfileRepository;

    public PayrollCalculationService(EmployeeRepository employeeRepository,
                                     AttendanceLogRepository attendanceRepository,
                                     SalaryProfileRepository salaryProfileRepository) {
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.salaryProfileRepository = salaryProfileRepository;
    }

    public List<PayrollResultDTO> calculateMonthlyPayroll(YearMonth month) {

        List<Employee> employees =
                employeeRepository.findActiveEmployeesForPayroll();

        return employees.stream()
                .map(emp -> calculateForEmployee(emp, month))
                .toList();
    }

    private PayrollResultDTO calculateForEmployee(Employee employee, YearMonth month) {

        SalaryProfile profile = salaryProfileRepository
                .findActiveProfile(employee.getEmployeeId(), month.atDay(1))
                .orElseThrow(() ->
                        new RuntimeException("No salary profile found"));

        BigDecimal baseSalary = profile.getBaseSalary();

        LocalDate start = month.atDay(1);
        LocalDate end = month.atEndOfMonth();

        BigDecimal otHours =
                attendanceRepository.sumOtHours(employee.getEmployeeId(), start, end);

        BigDecimal absentDays =
                attendanceRepository.countAbsentDays(employee.getEmployeeId(), start, end);

        BigDecimal dailyRate =
                baseSalary.divide(BigDecimal.valueOf(22), 2, RoundingMode.HALF_UP);

        BigDecimal hourlyRate =
                dailyRate.divide(BigDecimal.valueOf(8), 2, RoundingMode.HALF_UP);

        BigDecimal otPay =
                hourlyRate.multiply(otHours)
                        .multiply(BigDecimal.valueOf(1.5));

        BigDecimal absentDeduction =
                dailyRate.multiply(absentDays);

        BigDecimal finalSalary =
                baseSalary.add(otPay)
                        .subtract(absentDeduction);

        return new PayrollResultDTO(
                employee.getEmployeeId(),
                //employee.getFullName(),
                baseSalary,
                null,
                otHours,
                absentDays,
                otPay,
                absentDeduction,
                finalSalary
        );
    }
}
