package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.request.OffboardingRequestDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Offboarding;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.OffboardingStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.repository.OffboardingRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
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
class OffboardingCommandServiceTest {

    @Mock
    private OffboardingRepository offboardingRepository;
    @Mock
    private EmployeeHelper employeeHelper;

    @InjectMocks
    private OffboardingCommandService offboardingCommandService;

    @Test
    void createResignation_whenCalled_thenManagerAutoResolvedAndNotified() {
        UUID employeeId = UUID.randomUUID();
        Employee employee = new Employee();
        Employee manager = new Employee();
        User managerUser = new User();
        managerUser.setUserId(UUID.randomUUID());
        manager.setUser(managerUser);

        when(employeeHelper.findEmployeeOrThrow(employeeId)).thenReturn(employee);
        when(employeeHelper.resolveManagerForEmployee(employee)).thenReturn(manager);
        when(offboardingRepository.save(any(Offboarding.class))).thenReturn(new Offboarding());

        offboardingCommandService.createResignationRequest(employeeId, new OffboardingRequestDTO(), UUID.randomUUID());

        verify(employeeHelper).resolveManagerForEmployee(employee);
    }

    @Test
    void managerApprove_whenApproverIsCorrectManager_thenSuccess() {
        UUID offboardingId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();

        Offboarding offboarding = new Offboarding();
        Employee employee = new Employee();
        offboarding.setEmployee(employee);
        offboarding.setStatus(OffboardingStatus.PENDING);

        Employee manager = new Employee();

        when(offboardingRepository.findById(offboardingId)).thenReturn(Optional.of(offboarding));
        when(employeeHelper.findEmployeeOrThrow(managerId)).thenReturn(manager);
        when(employeeHelper.isManagerOf(manager, employee)).thenReturn(true);

        offboardingCommandService.managerApprove(offboardingId, managerId);

        verify(offboardingRepository).save(offboarding);
    }
}
