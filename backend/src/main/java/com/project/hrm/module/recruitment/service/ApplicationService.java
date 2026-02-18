package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.ApplicationResponseDTO;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.mapper.ApplicationMapper;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    /**
     * Lấy danh sách application có trạng thái HIRED, có phân trang.
     * Sử dụng @Transactional(readOnly = true) để tối ưu performance.
     */
    @Transactional(readOnly = true)
    public Page<ApplicationResponseDTO> getHiredApplications(Pageable pageable) {
        return applicationRepository
                .findByStatus(ApplicationStatus.HIRED, pageable)
                .map(ApplicationMapper::toDTO);
    }
}
