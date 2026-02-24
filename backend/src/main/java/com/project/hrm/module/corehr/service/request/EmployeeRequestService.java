package com.project.hrm.module.corehr.service.request;

import com.project.hrm.module.corehr.dto.request.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.dto.response.ChangeRequestResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Request;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.RequestStatus;
import com.project.hrm.module.corehr.enums.RequestType;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.mapper.ChangeRequestMapper;
import com.project.hrm.module.corehr.repository.EmployeeChangeRequestRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class EmployeeRequestService {

    private static final Set<EmployeeStatus> ACTIVE_STATUSES = Set.of(
            EmployeeStatus.OFFICIAL,
            EmployeeStatus.PROBATION);

    private final EmployeeRepository employeeRepository;
    private final EmployeeChangeRequestRepository changeRequestRepository;

    public EmployeeRequestService(
            EmployeeRepository employeeRepository,
            EmployeeChangeRequestRepository changeRequestRepository) {
        this.employeeRepository = employeeRepository;
        this.changeRequestRepository = changeRequestRepository;
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    @Transactional
    public ChangeRequestResponseDTO createChangeRequest(UUID employeeId, ChangeRequestCreateDTO dto) {
        Employee employee = findActiveEmployee(employeeId);

        // Only CHANGE_OF_INFOMATION and CHANGE_OF_POSITION are supported
        Set<RequestType> supported = Set.of(RequestType.CHANGE_OF_INFORMATION, RequestType.CHANGE_OF_POSITION);
        if (!supported.contains(dto.getType())) {
            throw new BusinessRuleException(ErrorCode.ACCESS_DENIED,
                    "Request type not supported via this endpoint: " + dto.getType());
        }

        validateNoPendingRequest(employeeId);

        Map<String, Object> oldData = ChangeRequestMapper.buildOldData(employee, dto);
        Map<String, Object> newData = ChangeRequestMapper.buildNewData(dto);

        validateDataChanged(oldData, newData);

        Request request = Request.builder()
                .employee(employee)
                .type(dto.getType())
                .reason(dto.getReason())
                .requestData(newData)
                .status(RequestStatus.PENDING)
                .build();

        Request saved = changeRequestRepository.saveAndFlush(request);
        return ChangeRequestMapper.toResponseDTO(saved);
    }

    // ─── LIST (own requests) ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ChangeRequestResponseDTO> getMyRequests(UUID employeeId) {
        return changeRequestRepository
                .findByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(ChangeRequestMapper::toResponseDTO)
                .toList();
    }

    // ─── GET DETAIL ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ChangeRequestResponseDTO getRequestDetail(UUID requestId, UUID employeeId) {
        Request request = findRequest(requestId);
        // Owner OR HR can view — ownership check done at controller level via
        // PreAuthorize or here:
        if (!request.getEmployee().getEmployeeId().equals(employeeId)) {
            throw new BusinessRuleException(ErrorCode.ACCESS_DENIED,
                    "You can only view your own requests");
        }
        return ChangeRequestMapper.toResponseDTO(request);
    }

    // ─── APPROVE ─────────────────────────────────────────────────────────────

    @Transactional
    public ChangeRequestResponseDTO approveRequest(UUID requestId) {
        Request request = findRequest(requestId);
        ensurePending(request);
        request.setStatus(RequestStatus.APPROVED);
        return ChangeRequestMapper.toResponseDTO(changeRequestRepository.save(request));
    }

    // ─── REJECT ──────────────────────────────────────────────────────────────

    @Transactional
    public ChangeRequestResponseDTO rejectRequest(UUID requestId) {
        Request request = findRequest(requestId);
        ensurePending(request);
        request.setStatus(RequestStatus.REJECTED);
        return ChangeRequestMapper.toResponseDTO(changeRequestRepository.save(request));
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private Employee findActiveEmployee(UUID employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessRuleException(
                        ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Employee not found with id: " + employeeId));
    }

    private Request findRequest(UUID requestId) {
        return changeRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessRuleException(
                        ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Request not found with id: " + requestId));
    }

    private void ensurePending(Request request) {
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BusinessRuleException(ErrorCode.ACCESS_DENIED,
                    "Only PENDING requests can be approved or rejected");
        }
    }

    private void validateNoPendingRequest(UUID employeeId) {
        if (changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                employeeId, RequestStatus.PENDING)) {
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
