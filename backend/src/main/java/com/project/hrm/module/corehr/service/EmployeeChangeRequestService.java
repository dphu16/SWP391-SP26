package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.dto.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.ResponseDTO.ChangeRequestResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.EmployeeChangeRequest;
import com.project.hrm.module.corehr.enums.ChangeRequestStatus;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.mapper.ChangeRequestMapper;
import com.project.hrm.module.corehr.repository.EmployeeChangeRequestRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class EmployeeChangeRequestService {

    private static final Set<EmployeeStatus> ACTIVE_STATUSES = Set.of(
            EmployeeStatus.OFFICIAL,
            EmployeeStatus.PROBATION);

    private final EmployeeRepository employeeRepository;
    private final EmployeeChangeRequestRepository changeRequestRepository;

    public EmployeeChangeRequestService(
            EmployeeRepository employeeRepository,
            EmployeeChangeRequestRepository changeRequestRepository) {
        this.employeeRepository = employeeRepository;
        this.changeRequestRepository = changeRequestRepository;
    }

    @Transactional
    public ChangeRequestResponseDTO createChangeRequest(UUID employeeId,
            ChangeRequestCreateDTO dto,
            UUID createdBy) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessRuleException(
                        ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Employee not found with id: " + employeeId));

        validateNoPendingRequest(employeeId);

        Map<String, Object> oldData = ChangeRequestMapper.buildOldData(employee, dto);
        Map<String, Object> newData = ChangeRequestMapper.buildNewData(dto);

        validateDataChanged(oldData, newData);

        EmployeeChangeRequest request = EmployeeChangeRequest.builder()
                .employee(employee)
                .oldData(oldData)
                .newData(newData)
                .status(ChangeRequestStatus.PENDING)
                .createdBy(createdBy)
                .build();

        EmployeeChangeRequest saved = changeRequestRepository.saveAndFlush(request);

        return ChangeRequestMapper.toResponseDTO(saved);
    }

    private void validateNoPendingRequest(UUID employeeId) {
        if (changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                employeeId, ChangeRequestStatus.PENDING)) {
            throw new BusinessRuleException(
                    ErrorCode.PENDING_REQUEST_EXISTS,
                    "Employee already has a pending change request");
        }
    }

    private void validateDataChanged(Map<String, Object> oldData, Map<String, Object> newData) {
        if (ChangeRequestMapper.isDataUnchanged(oldData, newData)) {
            throw new BusinessRuleException(
                    ErrorCode.NO_DATA_CHANGED,
                    "No data changes detected. New data is identical to current data");
        }
    }
}
