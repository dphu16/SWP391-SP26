package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingResponseDTO;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.corehr.mapper.OnboardingMapper;
import com.project.hrm.module.corehr.repository.OnboardingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OnboardingService implements IOnboardingService {

    private final OnboardingRepository applicationRepository;
    private final OnboardingCommandService onboaringCommandService;

    public OnboardingService(OnboardingRepository applicationRepository, OnboardingCommandService onboaringCommandService) {
        this.applicationRepository = applicationRepository;
        this.onboaringCommandService = onboaringCommandService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OnboardingResponseDTO> getHiredApplications(Pageable pageable) {
        return applicationRepository
                .findByStatus(ApplicationStatus.HIRED, pageable)
                .map(OnboardingMapper::toDTO);
    }

    @Override
    public NewHireResponseDTO createNewHire(CreateNewHireDTO request) {
        return onboaringCommandService.createNewHire(request);
    }
}
