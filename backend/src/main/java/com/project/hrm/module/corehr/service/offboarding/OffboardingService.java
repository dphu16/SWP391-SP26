package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OffboardingService implements IOffboardingService {

    private OffboardingQueryService queryService;

    public OffboardingService(OffboardingQueryService queryService) {
        this.queryService = queryService;
    }

    @Override
    public List<InactiveEmployeeResponseDTO> getInactiveEmployees() {
        return queryService.getInactiveEmployees();
    }
}
