package com.project.hrm.module.corehr.service.approval;

import com.project.hrm.module.corehr.dto.request.ApprovalActionDTO;
import com.project.hrm.module.corehr.dto.response.ApprovalRequestResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.enums.ErrorCode;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.enums.RequestType;
import com.project.hrm.module.request.repository.RequestRepository;
import com.project.hrm.module.corehr.service.onboarding.ActivationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovalRequestService {

        private final RequestRepository requestRepository;
        private final EmployeeRepository employeeRepository;
        private final ActivationService activationService;

        @Transactional
        public ApprovalRequestResponseDTO createApprovalRequest(UUID employeeId) {
                Employee employee = employeeRepository.findById(employeeId)
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.EMPLOYEE_NOT_FOUND,
                                                "Employee not found with id: " + employeeId));

                // Check if a PENDING approval request already exists for this employee
                boolean pendingExists = requestRepository
                                .existsByEmployeeIdAndStatus(employeeId, RequestStatus.PENDING);
                if (pendingExists) {
                        throw new BusinessRuleException(
                                        ErrorCode.APPROVAL_REQUEST_EXISTS,
                                        "A pending approval request already exists for employee: " + employeeId);
                }

                Request request = Request.builder()
                                .employeeId(employeeId)
                                .requestType(RequestType.APPROVAL)
                                .status(RequestStatus.PENDING)
                                .build();

                Request saved = requestRepository.save(request);

                return toResponseDTO(saved);
        }

        @Transactional
        public ApprovalRequestResponseDTO processApprovalRequest(UUID requestId, ApprovalActionDTO actionDTO) {
                // Validate: REJECT requires a reason
                if (actionDTO.getAction() == RequestStatus.REJECTED
                                && (actionDTO.getReason() == null || actionDTO.getReason().isBlank())) {
                        throw new BusinessRuleException(
                                        ErrorCode.INVALID_APPROVAL_ACTION,
                                        "Reason is required when rejecting an approval request");
                }

                Request request = requestRepository.findById(requestId)
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.APPROVAL_REQUEST_NOT_FOUND,
                                                "Approval request not found with id: " + requestId));

                if (request.getStatus() != RequestStatus.PENDING) {
                        throw new BusinessRuleException(
                                        ErrorCode.INVALID_APPROVAL_ACTION,
                                        "Approval request has already been processed");
                }

                Employee employee = employeeRepository.findById(request.getEmployeeId())
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.EMPLOYEE_NOT_FOUND,
                                                "Employee not found with id: " + request.getEmployeeId()));

                if (actionDTO.getAction() == RequestStatus.APPROVED) {
                        request.setStatus(RequestStatus.APPROVED);
                        employee.setEmpStatus(ProgressStatus.PENDING_VERIFY);
                        employeeRepository.save(employee);

                        // Auto-trigger activation email when status becomes APPROVAL
                        activationService.sendActivationEmail(employee.getEmployeeId());
                } else {
                        request.setStatus(RequestStatus.REJECTED);
                        request.setManagerComment(actionDTO.getReason());
                        employee.setEmpStatus(ProgressStatus.REJECTED);
                        if (employee.getUser() != null) {
                                employee.getUser().setStatus(UserStatus.INACTIVE);
                        }
                        employee.setStatus(EmployeeStatus.TERMINATED);
                }

                employeeRepository.save(employee);
                Request saved = requestRepository.save(request);

                return toResponseDTO(saved);
        }

        private ApprovalRequestResponseDTO toResponseDTO(Request entity) {
                return ApprovalRequestResponseDTO.builder()
                                .requestId(entity.getRequestId())
                                .employeeId(entity.getEmployeeId())
                                .status(entity.getStatus())
                                .reason(entity.getReason())
                                .createdAt(entity.getCreatedAt())
                                .build();
        }
}