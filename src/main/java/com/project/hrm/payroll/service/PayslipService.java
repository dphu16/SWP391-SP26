package com.project.hrm.payroll.service;

import com.project.hrm.payroll.entity.Payslip;
import com.project.hrm.payroll.repository.PayslipRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PayslipService {

    private final PayslipRepository payslipRepository;

    public PayslipService(PayslipRepository payslipRepository) {
        this.payslipRepository = payslipRepository;
    }

    public List<Payslip> getPayslipsByEmployee(Long employeeId) {
        return payslipRepository.findByEmployeeId(employeeId);
    }
}
