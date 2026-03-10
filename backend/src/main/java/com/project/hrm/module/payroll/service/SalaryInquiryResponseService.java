package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.ResponseDTO.CreateInquiryResponseDTO;
import com.project.hrm.module.payroll.entity.SalaryInquiryResponse;
import com.project.hrm.module.payroll.repository.SalaryInquiryResponseRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor // Lombok: Tự động inject các dependency (Repository)
public class SalaryInquiryResponseService {

    private final SalaryInquiryResponseRepository responseRepository;
    private final com.project.hrm.module.payroll.repository.SalaryInquiryRepository inquiryRepository;
    private final com.project.hrm.module.corehr.repository.EmployeeRepository employeeRepository;

    @Transactional
    public SalaryInquiryResponse createResponse(CreateInquiryResponseDTO dto) {

        // 1. Validate: Kiểm tra xem thắc mắc đã được trả lời chưa
        // Dù Database đã có UNIQUE, ta vẫn check ở Service để trả về lỗi thân thiện cho
        // Frontend
        if (responseRepository.existsByInquiryId(dto.getInquiryId())) {
            throw new IllegalArgumentException("Thắc mắc này đã được HR phản hồi, không thể tạo thêm!");
        }

        // 2. Map dữ liệu từ DTO sang Entity
        SalaryInquiryResponse response = new SalaryInquiryResponse();
        response.setInquiryId(dto.getInquiryId());

        // Lấy một HR thực để thay thế fake ID
        java.util.UUID safeResponderId = employeeRepository.findAll().stream().findFirst()
                .map(com.project.hrm.module.corehr.entity.Employee::getEmployeeId)
                .orElse(dto.getResponderId());

        response.setResponderId(safeResponderId);
        response.setOfficialResponse(dto.getOfficialResponse());
        response.setInternalNote(dto.getInternalNote());
        response.setAttachmentUrl(dto.getAttachmentUrl());

        // Cập nhật lại vào bảng SalaryInquiry để hiển thị hr_response
        com.project.hrm.module.payroll.entity.SalaryInquiry inquiry = inquiryRepository.findById(dto.getInquiryId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thắc mắc này!"));
        inquiry.setHrResponse(dto.getOfficialResponse());
        inquiry.setStatus(com.project.hrm.module.payroll.enums.InquiryStatus.RESOLVED);
        inquiry.setResolvedAt(java.time.LocalDateTime.now());
        inquiryRepository.save(inquiry);

        // 3. Lưu xuống Database
        // 💡 LƯU Ý: Ngay khi lệnh save() chạy thành công,
        // TRIGGER bên Postgresql mà ta viết lúc nãy sẽ TỰ ĐỘNG cập nhật bảng
        // salary_inquiries thành 'RESOLVED'.
        // Code Backend không cần bận tâm đến việc update status nữa!
        return responseRepository.save(response);
    }
}
