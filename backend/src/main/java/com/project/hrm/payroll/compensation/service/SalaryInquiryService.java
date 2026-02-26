package com.project.hrm.payroll.compensation.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.payroll.common.enums.InquiryStatus;
import com.project.hrm.payroll.compensation.dto.RequestDTO.CreateInquiryRequest;
import com.project.hrm.payroll.compensation.dto.ResponseDTO.InquiryResponse;
import com.project.hrm.payroll.compensation.entity.Payslip;
import com.project.hrm.payroll.compensation.entity.SalaryInquiry;
import com.project.hrm.payroll.compensation.repository.PayslipRepository;
import com.project.hrm.payroll.compensation.repository.SalaryInquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalaryInquiryService {

    private final SalaryInquiryRepository inquiryRepository;
    private final EmployeeRepository employeeRepository;
    private final PayslipRepository payslipRepository;

    public InquiryResponse createInquiry(UUID employeeId, CreateInquiryRequest request) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow();

        Payslip payslip = null;
        if (request.getPayslipId() != null) {
            payslip = payslipRepository.findById(request.getPayslipId())
                    .orElseThrow();
        }

        SalaryInquiry inquiry = SalaryInquiry.builder()
                .employee(employee)
                .payslip(payslip)
                .subject(request.getSubject())
                .message(request.getMessage())
                .status(InquiryStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        inquiryRepository.save(inquiry);

        return mapToResponse(inquiry);
    }

    public List<InquiryResponse> getMyInquiries(UUID employeeId) {
        return inquiryRepository.findByEmployeeEmployeeId(employeeId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private InquiryResponse mapToResponse(SalaryInquiry inquiry) {
        return InquiryResponse.builder()
                .id(inquiry.getId())
                .subject(inquiry.getSubject())
                .message(inquiry.getMessage())
                .status(inquiry.getStatus())
                .hrResponse(inquiry.getHrResponse())
                .createdAt(inquiry.getCreatedAt())
                .resolvedAt(inquiry.getResolvedAt())
                .build();
    }
}
