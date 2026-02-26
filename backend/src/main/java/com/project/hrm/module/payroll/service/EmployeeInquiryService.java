package com.project.hrm.module.payroll.service;


import com.project.hrm.module.payroll.dto.RequestDTO.CreateInquiryRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.InquiryResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.entity.SalaryInquiry;
import com.project.hrm.module.payroll.enums.InquiryStatus;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import com.project.hrm.module.payroll.repository.SalaryInquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeInquiryService {

    private final SalaryInquiryRepository inquiryRepository;
    private final PayslipRepository payslipRepository;

    /**
     * Tạo mới một thắc mắc
     */
    @Transactional
    public InquiryResponseDTO createInquiry(UUID employeeId, CreateInquiryRequest request) {

        // 1. Khởi tạo Entity
        SalaryInquiry inquiry = new SalaryInquiry();

        // Set Employee (Giả định bạn có constructor hoặc builder cho Employee với ID)
        Employee employee = new Employee();
        employee.setEmployeeId(employeeId);
        inquiry.setEmployee(employee);

        inquiry.setSubject(request.getSubject());
        inquiry.setMessage(request.getMessage());
        inquiry.setStatus(InquiryStatus.OPEN); // Mặc định là OPEN
        inquiry.setCreatedAt(LocalDateTime.now());

        // 2. Validate Payslip nếu có
        if (request.getPayslipId() != null) {
            Payslip payslip = payslipRepository.findById(request.getPayslipId())
                    .orElseThrow(() -> new RuntimeException("Payslip not found"));

            // Bảo mật: Không được thắc mắc vào phiếu lương của người khác
            if (!payslip.getEmployee().getEmployeeId().equals(employeeId)) {
                throw new RuntimeException("Invalid Payslip ID");
            }
            inquiry.setPayslip(payslip);
        }

        // 3. Lưu xuống DB
        SalaryInquiry saved = inquiryRepository.save(inquiry);

        // 4. Map sang DTO trả về
        return mapToDto(saved);
    }

    /**
     * Xem danh sách thắc mắc đã gửi
     */
    @Transactional(readOnly = true)
    public Page<InquiryResponseDTO> getMyInquiries(UUID employeeId, Pageable pageable) {
        return inquiryRepository.findByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId, pageable)
                .map(this::mapToDto);
    }

    // Helper mapper
    private InquiryResponseDTO mapToDto(SalaryInquiry entity) {
        String periodInfo = null;
        UUID payslipId = null;

        if (entity.getPayslip() != null) {
            payslipId = entity.getPayslip().getPayslipId();
            // Lấy thông tin tháng/năm cho dễ đọc
            // Lưu ý: Cần đảm bảo Payslip đã fetch PayrollPeriod nếu không sẽ bị LazyInitializationException
            // Trong thực tế nên dùng DTO projection hoặc EntityGraph, ở đây giả sử đã fetch.
            if (entity.getPayslip().getPayrollPeriod() != null) {
                periodInfo = entity.getPayslip().getPayrollPeriod().getMonth() + "/"
                        + entity.getPayslip().getPayrollPeriod().getYear();
            }
        }

        return InquiryResponseDTO.builder()
                .id(entity.getId())
                .subject(entity.getSubject())
                .message(entity.getMessage())
                .status(entity.getStatus())
                .hrResponse(entity.getHrResponse())
                .createdAt(entity.getCreatedAt())
                .resolvedAt(entity.getResolvedAt())
                .payslipId(payslipId)
                .payslipPeriod(periodInfo)
                .build();
    }
}
