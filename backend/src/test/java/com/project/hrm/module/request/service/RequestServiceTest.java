package com.project.hrm.module.request.service;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import com.project.hrm.module.request.dto.RequestDTO;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.enums.RequestType;
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
class RequestServiceTest {

    @Mock
    private RequestRepository requestRepo;
    @Mock
    private EmployeeRepository employeeRepo;
    @Mock
    private EmployeeHelper employeeHelper;

    @InjectMocks
    private RequestService requestService;


    @Test
    void approve_whenApproverIsCorrectManager_thenSuccess() {
        UUID requestId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();
        Request request = new Request();
        request.setStatus(RequestStatus.PENDING);
        request.setEmployeeId(UUID.randomUUID());

        Employee employee = new Employee();
        Employee manager = new Employee();

        when(requestRepo.findById(requestId)).thenReturn(Optional.of(request));
        when(employeeRepo.findById(request.getEmployeeId())).thenReturn(Optional.of(employee));
        when(employeeHelper.findEmployeeOrThrow(managerId)).thenReturn(manager);
        when(employeeHelper.isManagerOf(manager, employee)).thenReturn(true);

        requestService.approveRequest(requestId, new RequestDTO(), managerId);

        verify(requestRepo).save(request);
    }

    @Test
    void approve_whenApproverIsWrongManager_thenThrowForbidden() {
        UUID requestId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();
        Request request = new Request();
        request.setStatus(RequestStatus.PENDING);
        request.setEmployeeId(UUID.randomUUID());

        Employee employee = new Employee();
        Employee manager = new Employee();

        when(requestRepo.findById(requestId)).thenReturn(Optional.of(request));
        when(employeeRepo.findById(request.getEmployeeId())).thenReturn(Optional.of(employee));
        when(employeeHelper.findEmployeeOrThrow(managerId)).thenReturn(manager);
        when(employeeHelper.isManagerOf(manager, employee)).thenReturn(false);

        assertThrows(BusinessRuleException.class, () -> {
            requestService.approveRequest(requestId, new RequestDTO(), managerId);
        });
    }
}
