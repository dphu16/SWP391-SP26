package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IOnboardingService {

    Page<OnboardingResponseDTO> getHiredApplications(Pageable pageable);

    NewHireResponseDTO createNewHire(CreateNewHireDTO request);
}
