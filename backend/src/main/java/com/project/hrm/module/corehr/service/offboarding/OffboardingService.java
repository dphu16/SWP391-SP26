package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.request.CancelOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.HRConfirmOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.OffboardingRequestDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.dto.response.OffboardingResponseDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class OffboardingService implements IOffboardingService {

    private final OffboardingQueryService queryService;
    private final OffboardingCommandService commandService;

    public OffboardingService(OffboardingQueryService queryService, OffboardingCommandService commandService) {
        this.queryService = queryService;
        this.commandService = commandService;
    }

    @Override
    public OffboardingResponseDTO createResignationRequest(UUID employeeId, OffboardingRequestDTO dto,
            UUID requestedBy) {
        return commandService.createResignationRequest(employeeId, dto, requestedBy);
    }

    @Override
    public OffboardingResponseDTO createManagerProposedRequest(UUID employeeId, OffboardingRequestDTO dto,
            UUID managerId) {
        return commandService.createManagerProposedRequest(employeeId, dto, managerId);
    }

    @Override
    public OffboardingResponseDTO managerApprove(UUID offboardingId, UUID managerId) {
        return commandService.managerApprove(offboardingId, managerId);
    }

    @Override
    public OffboardingResponseDTO hrConfirm(UUID offboardingId, HRConfirmOffboardingDTO dto, UUID hrEmployeeId) {
        return commandService.hrConfirm(offboardingId, dto, hrEmployeeId);
    }

    @Override
    public OffboardingResponseDTO cancelOffboarding(UUID offboardingId, CancelOffboardingDTO dto, UUID cancelledBy) {
        return commandService.cancelOffboarding(offboardingId, dto, cancelledBy);
    }

    @Override
    public List<OffboardingResponseDTO> getActiveRequests() {
        return queryService.getActiveRequests();
    }

    @Override
    public List<OffboardingResponseDTO> getPendingRequests() {
        return queryService.getPendingRequests();
    }

    @Override
    public OffboardingResponseDTO getOffboardingById(UUID offboardingId) {
        return queryService.getOffboardingById(offboardingId);
    }

    @Override
    public List<InactiveEmployeeResponseDTO> getInactiveEmployees() {
        return queryService.getInactiveEmployees();
    }

    @Override
    public EmployeeDetailDTO terminateEmployee(UUID id) {
        return commandService.terminateEmployee(id);
    }

    @Override
    public EmployeeDetailDTO activateEmployee(UUID id) {
        return commandService.activateEmployee(id);
    }
}
