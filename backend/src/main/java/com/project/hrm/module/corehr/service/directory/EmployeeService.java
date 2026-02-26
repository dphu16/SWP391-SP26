package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class EmployeeService implements IEmployeeService {
    private final EmployeeQueryService queryService;
    private final EmployeeCommandService commandService;

    public EmployeeService(EmployeeQueryService queryService, EmployeeCommandService commandService) {
        this.queryService = queryService;
        this.commandService = commandService;
    }

    @Override
    public Page getAllEmployees(Pageable pageable) {
        return queryService.getAllEmployees(pageable);
    }

    @Override
    public EmployeeDetailDTO getEmployeeDetail(UUID id) {
        return queryService.getEmployeeDetail(id);
    }

    @Override
    public EmployeeDetailDTO updateEmployee(UUID id, EmployeeChangeDTO req) {
        return commandService.updateEmployee(id, req);
    }
}
