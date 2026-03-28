package com.project.hrm.module.corehr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.domain.Page;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OnboardingListResponseDTO {

    private Page<OnboardingResponseDTO> hiredApplications;
    private Page<OnboardingResponseDTO> onboardingEmployees;
}
