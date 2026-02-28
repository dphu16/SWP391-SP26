package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class OffboardingService implements IOffboardingService {

    private OffboardingQueryService queryService;
    private OffboardingCommandService commandService;

    public OffboardingService(OffboardingQueryService queryService, OffboardingCommandService commandService) {
        this.queryService = queryService;
        this.commandService = commandService;
    }

    @Override
    public EmployeeDetailDTO terminateEmployee(UUID id) {
        return commandService.terminateEmployee(id);
    }

    @Override
    public EmployeeDetailDTO activateEmployee(UUID id) {
        return commandService.activateEmployee(id);
    }

    @Override
    public List<InactiveEmployeeResponseDTO> getInactiveEmployees() {
        return queryService.getInactiveEmployees();
    }
}
