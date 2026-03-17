package com.project.hrm.module.corehr.service.approval;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import com.project.hrm.module.corehr.service.helper.NotificationService;
import com.project.hrm.module.corehr.service.onboarding.ActivationService;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.repository.RequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApprovalRequestServiceTest {

    @Mock
    private RequestRepository requestRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private EmployeeHelper employeeHelper;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ActivationService activationService;

    @InjectMocks
    private ApprovalRequestService approvalRequestService;

    @Test
    void createApprovalRequest_whenValidEmployee_thenResolveManagerAndNotify() {
        UUID employeeId = UUID.randomUUID();
        Employee employee = new Employee();
        employee.setEmployeeId(employeeId);

        Employee manager = new Employee();
        manager.setEmployeeId(UUID.randomUUID());
        User managerUser = new User();
        managerUser.setUserId(UUID.randomUUID());
        manager.setUser(managerUser);

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(requestRepository.existsByEmployeeIdAndStatus(employeeId, RequestStatus.PENDING)).thenReturn(false);
        when(employeeHelper.resolveManagerForEmployee(employee)).thenReturn(manager);

        Request savedRequest = new Request();
        savedRequest.setRequestId(UUID.randomUUID());
        when(requestRepository.save(any(Request.class))).thenReturn(savedRequest);

        approvalRequestService.createApprovalRequest(employeeId);

        verify(employeeHelper).resolveManagerForEmployee(employee);
        verify(notificationService).createForUser(
                eq(managerUser.getUserId()),
                anyString(),
                anyString(),
                eq("REQUEST_RECEIVED"),
                eq("REQUEST"),
                any()
        );
        verify(requestRepository).save(any(Request.class));
    }

    @Test
    void createApprovalRequest_whenPendingExists_thenThrowException() {
        UUID employeeId = UUID.randomUUID();
        Employee employee = new Employee();
        
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(requestRepository.existsByEmployeeIdAndStatus(employeeId, RequestStatus.PENDING)).thenReturn(true);

        assertThrows(BusinessRuleException.class, () -> {
            approvalRequestService.createApprovalRequest(employeeId);
        });
    }

    @Test
    void createApprovalRequest_whenManagerCannotBeResolved_thenStillSaveRequestWithoutApprover() {
        UUID employeeId = UUID.randomUUID();
        Employee employee = new Employee();
        employee.setEmployeeId(employeeId);

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(requestRepository.existsByEmployeeIdAndStatus(employeeId, RequestStatus.PENDING)).thenReturn(false);
        when(employeeHelper.resolveManagerForEmployee(employee)).thenThrow(new RuntimeException("No manager"));

        Request savedRequest = new Request();
        when(requestRepository.save(any(Request.class))).thenReturn(savedRequest);

        approvalRequestService.createApprovalRequest(employeeId);

        verify(requestRepository).save(any(Request.class));
        verifyNoInteractions(notificationService);
    }
}
