package com.project.hrm.payroll.service;

import com.project.hrm.payroll.entity.Payroll;
import com.project.hrm.payroll.repository.PayrollRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PayrollService {

    private final PayrollRepository payrollRepository;

    public PayrollService(PayrollRepository payrollRepository) {
        this.payrollRepository = payrollRepository;
    }

    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAll();
    }

    public Payroll createPayroll(Payroll payroll) {
        return payrollRepository.save(payroll);
    }
}
