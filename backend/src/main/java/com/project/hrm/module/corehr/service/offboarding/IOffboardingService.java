package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;

import java.util.List;

public interface IOffboardingService {
    List<InactiveEmployeeResponseDTO> getInactiveEmployees();
}
