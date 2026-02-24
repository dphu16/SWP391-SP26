package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.mapper.InactiveEmployeeMapper;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OffboardingQueryService {

    private final EmployeeRepository employeeRepository;

    public OffboardingQueryService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public List<InactiveEmployeeResponseDTO> getInactiveEmployees() {
        List<EmployeeStatus> inactiveStatuses = List.of(
                EmployeeStatus.TERMINATED,
                EmployeeStatus.RESIGNED);

        return employeeRepository.findByEmpStatusIn(inactiveStatuses)
                .stream()
                .map(InactiveEmployeeMapper::toDTO)
                .toList();
    }
}
