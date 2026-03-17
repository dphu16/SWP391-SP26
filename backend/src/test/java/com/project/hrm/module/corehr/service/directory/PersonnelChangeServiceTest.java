package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.PersonnelChangeRequestDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.PersonnelChange;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.PersonnelChangeStatus;
import com.project.hrm.module.corehr.enums.PersonnelChangeType;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.repository.PersonnelChangeRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import com.project.hrm.module.corehr.service.helper.NotificationService;
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
class PersonnelChangeServiceTest {

    @Mock
    private PersonnelChangeRepository changeRepository;
    @Mock
    private EmployeeHelper employeeHelper;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PersonnelChangeService personnelChangeService;

    @Test
    void createRequest_whenCalled_thenManagerAutoResolvedAndNotified() {
        PersonnelChangeRequestDTO dto = new PersonnelChangeRequestDTO();
        dto.setEmployeeId(UUID.randomUUID());
        dto.setChangeType(PersonnelChangeType.TRANSFER);

        Employee employee = new Employee();
        Employee manager = new Employee();
        User managerUser = new User();
        managerUser.setUserId(UUID.randomUUID());
        manager.setUser(managerUser);

        when(employeeHelper.findEmployeeOrThrow(dto.getEmployeeId())).thenReturn(employee);
        when(employeeHelper.resolveManagerForEmployee(employee)).thenReturn(manager);
        when(changeRepository.save(any(PersonnelChange.class))).thenReturn(new PersonnelChange());

        personnelChangeService.createRequest(dto, UUID.randomUUID());

        verify(employeeHelper).resolveManagerForEmployee(employee);
        verify(notificationService).createForUser(eq(managerUser.getUserId()), any(), any(), eq("PERSONNEL_CHANGE_RECEIVED"), any(), any());
    }

    @Test
    void managerApprove_whenApproverIsCorrectManager_thenSuccess() {
        UUID changeId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();

        PersonnelChange change = new PersonnelChange();
        Employee employee = new Employee();
        change.setEmployee(employee);
        change.setStatus(PersonnelChangeStatus.PENDING);

        Employee manager = new Employee();

        when(changeRepository.findById(changeId)).thenReturn(Optional.of(change));
        when(employeeHelper.findEmployeeOrThrow(managerId)).thenReturn(manager);
        when(employeeHelper.isManagerOf(manager, employee)).thenReturn(true);

        personnelChangeService.managerApprove(changeId, managerId);

        verify(changeRepository).save(change);
    }

    @Test
    void managerApprove_whenApproverIsWrongManager_thenThrowForbidden() {
        UUID changeId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();

        PersonnelChange change = new PersonnelChange();
        Employee employee = new Employee();
        change.setEmployee(employee);

        Employee manager = new Employee();

        when(changeRepository.findById(changeId)).thenReturn(Optional.of(change));
        when(employeeHelper.findEmployeeOrThrow(managerId)).thenReturn(manager);
        when(employeeHelper.isManagerOf(manager, employee)).thenReturn(false);

        assertThrows(BusinessRuleException.class, () -> {
            personnelChangeService.managerApprove(changeId, managerId);
        });
    }
}
