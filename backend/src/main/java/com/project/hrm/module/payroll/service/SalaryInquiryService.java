package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.RequestDTO.CreateSalaryInquiryRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.RespondToInquiryRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.SalaryInquiryDto;            // DTO — đã đổi tên tránh trùng
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.entity.SalaryInquiry;
import com.project.hrm.module.payroll.entity.SalaryInquiryResponse;             // ENTITY — giữ nguyên tên
import com.project.hrm.module.payroll.enums.SalaryInquiryStatus;
import com.project.hrm.module.payroll.exception.AccessDeniedException;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import com.project.hrm.module.payroll.repository.SalaryInquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalaryInquiryService {

    private final SalaryInquiryRepository inquiryRepository;
    private final PayslipRepository payslipRepository;

    // ===================== EMPLOYEE =====================

    /** Employee: Tạo thắc mắc về phiếu lương của mình */
    @Transactional
    public SalaryInquiryDto createInquiry(UUID employeeId, CreateSalaryInquiryRequest request) {
        Payslip payslip = payslipRepository.findById(request.getPayslipId())
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu lương không tồn tại."));

        // [RULE] Employee chỉ được thắc mắc về phiếu lương của chính mình
        if (!payslip.getEmployee().getEmployeeId().equals(employeeId)) {
            throw new AccessDeniedException("Bạn không có quyền thắc mắc về phiếu lương này.");
        }

        // [RULE] Chỉ cho phép thắc mắc đối với kỳ lương mới nhất mà nhân viên có phiếu lương
        Optional<Payslip> latestPayslipOpt = payslipRepository
                .findFirstByEmployee_EmployeeIdOrderByPeriod_StartDateDesc(employeeId);

        if (latestPayslipOpt.isPresent()) {
            Payslip latestPayslip = latestPayslipOpt.get();
            if (!latestPayslip.getPeriod().getPeriodId().equals(payslip.getPeriod().getPeriodId())) {
                throw new PayrollException("Kỳ lương này đã qua. Hãy gửi thắc mắc cho kỳ lương mới nhất.");
            }
        }

        Employee employee = new Employee();
        employee.setEmployeeId(employeeId);

        SalaryInquiry inquiry = SalaryInquiry.builder()
                .employee(employee)
                .payslip(payslip)
                .subject(request.getSubject())
                .message(request.getMessage())
                .status(SalaryInquiryStatus.OPEN)
                .build();

        return toDto(inquiryRepository.save(inquiry), false);
    }

    /** Employee: Xem danh sách thắc mắc của mình */
    @Transactional(readOnly = true)
    public List<SalaryInquiryDto> getMyInquiries(UUID employeeId) {
        return inquiryRepository
                .findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(i -> toDto(i, false))
                .collect(Collectors.toList());
    }

    // ===================== HR =====================

    /** HR: Xem tất cả các ticket */
    @Transactional(readOnly = true)
    public List<SalaryInquiryDto> getAllInquiries() {
        return inquiryRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(i -> toDto(i, true))
                .collect(Collectors.toList());
    }

    /** HR: Chuyển ticket sang IN_PROGRESS khi bắt đầu xử lý */
    @Transactional
    public SalaryInquiryDto markInProgress(UUID inquiryId) {
        SalaryInquiry inquiry = findOrThrow(inquiryId);
        if (inquiry.getStatus() != SalaryInquiryStatus.OPEN) {
            throw new PayrollException("Ticket không ở trạng thái OPEN.");
        }
        inquiry.setStatus(SalaryInquiryStatus.IN_PROGRESS);
        return toDto(inquiryRepository.save(inquiry), true);
    }

    /**
     * HR: Phản hồi thắc mắc.
     * Tạo entity SalaryInquiryResponse (không phải DTO) để lưu vào DB.
     */
    @Transactional
    public SalaryInquiryDto respondToInquiry(UUID responderId, RespondToInquiryRequest request) {
        SalaryInquiry inquiry = findOrThrow(request.getInquiryId());

        if (inquiry.getStatus() == SalaryInquiryStatus.RESOLVED) {
            throw new PayrollException("Ticket này đã được xử lý rồi.");
        }
        if (inquiry.getResponse() != null) {
            throw new PayrollException("Ticket này đã có câu trả lời chính thức. Không thể ghi đè.");
        }

        Employee responder = new Employee();
        responder.setEmployeeId(responderId);

        // SalaryInquiryResponse ở đây là ENTITY
        SalaryInquiryResponse responseEntity = SalaryInquiryResponse.builder()
                .inquiry(inquiry)
                .responder(responder)
                .officialResponse(request.getOfficialResponse())
                .internalNote(request.getInternalNote())
                .attachmentUrl(request.getAttachmentUrl())
                .build();

        inquiry.setResponse(responseEntity);
        inquiry.setStatus(SalaryInquiryStatus.RESOLVED);
        inquiry.setResolvedAt(OffsetDateTime.now());

        return toDto(inquiryRepository.save(inquiry), true);
    }

    /** HR: Từ chối thắc mắc */
    @Transactional
    public SalaryInquiryDto rejectInquiry(UUID responderId, UUID inquiryId, String reason) {
        SalaryInquiry inquiry = findOrThrow(inquiryId);
        if (inquiry.getStatus() == SalaryInquiryStatus.RESOLVED
                || inquiry.getStatus() == SalaryInquiryStatus.REJECTED) {
            throw new PayrollException("Ticket đã được xử lý, không thể thay đổi trạng thái.");
        }

        Employee responder = new Employee();
        responder.setEmployeeId(responderId);

        SalaryInquiryResponse responseEntity = SalaryInquiryResponse.builder()
                .inquiry(inquiry)
                .responder(responder)
                .officialResponse("TỪ CHỐI: " + reason)
                .build();

        inquiry.setResponse(responseEntity);
        inquiry.setStatus(SalaryInquiryStatus.REJECTED);
        inquiry.setResolvedAt(OffsetDateTime.now());

        return toDto(inquiryRepository.save(inquiry), true);
    }

    // ===================== PRIVATE HELPERS =====================

    private SalaryInquiry findOrThrow(UUID id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thắc mắc không tồn tại: " + id));
    }

    /**
     * Convert entity SalaryInquiry → DTO SalaryInquiryDto.
     * @param includeInternalNote true = HR (thấy internal_note), false = Employee (không thấy)
     */
    private SalaryInquiryDto toDto(SalaryInquiry inquiry, boolean includeInternalNote) {
        SalaryInquiryDto.HrResponseDetail hrDetail = null;

        // getResponse() trả về entity SalaryInquiryResponse — không bị nhầm với DTO
        SalaryInquiryResponse responseEntity = inquiry.getResponse();
        if (responseEntity != null) {
            hrDetail = SalaryInquiryDto.HrResponseDetail.builder()
                    .responseId(responseEntity.getResponseId())
                    .responderName(responseEntity.getResponder().getFullName())
                    .officialResponse(responseEntity.getOfficialResponse())
                    .attachmentUrl(responseEntity.getAttachmentUrl())
                    .createdAt(responseEntity.getCreatedAt())
                    .build();
        }

        return SalaryInquiryDto.builder()
                .id(inquiry.getId())
                .employeeId(inquiry.getEmployee().getEmployeeId())
                .employeeName(inquiry.getEmployee().getFullName())
                .payslipId(inquiry.getPayslip().getPayslipId())
                .subject(inquiry.getSubject())
                .message(inquiry.getMessage())
                .status(inquiry.getStatus())
                .createdAt(inquiry.getCreatedAt())
                .resolvedAt(inquiry.getResolvedAt())
                .hrResponse(hrDetail)
                .build();
    }
}
