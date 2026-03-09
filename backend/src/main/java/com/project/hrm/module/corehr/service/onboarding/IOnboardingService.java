package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingListResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface IOnboardingService {

    OnboardingListResponseDTO getOnboardingList(Pageable pageable);

    NewHireResponseDTO createNewHire(CreateNewHireDTO request);

    CreateNewHireDTO getEmployeeForEdit(UUID employeeId);

    void resubmitRejectedEmployee(UUID employeeId, CreateNewHireDTO updatedData);
}
