package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.ResponseDTO.OnboardingResponseDTO;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.corehr.mapper.OnboardingMapper;
import com.project.hrm.module.corehr.repository.OnboardingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OnboardingService {

    private final OnboardingRepository applicationRepository;

    public OnboardingService(OnboardingRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    /**
     * Lấy danh sách application có trạng thái HIRED, có phân trang.
     * Sử dụng @Transactional(readOnly = true) để tối ưu performance.
     */
    @Transactional(readOnly = true)
    public Page<OnboardingResponseDTO> getHiredApplications(Pageable pageable) {
        return applicationRepository
                .findByStatus(ApplicationStatus.HIRED, pageable)
                .map(OnboardingMapper::toDTO);
    }
}
