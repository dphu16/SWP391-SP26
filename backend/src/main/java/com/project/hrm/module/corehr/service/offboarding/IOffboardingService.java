package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;

import java.util.List;
import java.util.UUID;

public interface IOffboardingService {
    List<InactiveEmployeeResponseDTO> getInactiveEmployees();

    EmployeeDetailDTO terminateEmployee(UUID id);

    EmployeeDetailDTO activateEmployee(UUID id);
}
