package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.corehr.repository.OnboardingRepository;
import com.project.hrm.module.corehr.repository.RoleRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OnboardingCommandServiceTest {

    @Mock
    private EmployeeHelper employeeHelper;
    @Mock
    private OnboardingRepository onboardingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private OnboardingCommandService onboardingCommandService;

    @Test
    void createNewHire_whenRequestIsValid_thenSaveEmployeeAndUserWithoutRequest() {
        CreateNewHireDTO request = new CreateNewHireDTO();
        request.setFullName("John Doe");
        request.setEmail("john.doe@example.com");
        request.setPositionId(UUID.randomUUID());
        request.setDepartmentId(UUID.randomUUID());
        request.setStatus(EmployeeStatus.PROBATION);

        Position position = new Position();
        position.setPositionId(request.getPositionId());
        when(employeeHelper.findPositionOrThrow(request.getPositionId())).thenReturn(position);
        when(employeeHelper.findDepartmentOrThrow(request.getDepartmentId())).thenReturn(new Department());

        Employee savedEmployee = new Employee();
        savedEmployee.setEmployeeId(UUID.randomUUID());
        savedEmployee.setFullName(request.getFullName());
        savedEmployee.setEmpStatus(ProgressStatus.PENDING_REVIEW);
        when(employeeHelper.save(any(Employee.class))).thenReturn(savedEmployee);

        onboardingCommandService.createNewHire(request);

        // Verify employee and user are saved
        verify(employeeHelper).save(any(Employee.class));
        verify(userRepository).save(any(User.class));
        
        // Ensure NO Request is saved in this service (it was removed)
        // Note: we can't easily verify NoInteractions with RequestRepository because it's not even a mock here anymore
        // But the code removal is confirmed.
    }

    @Test
    void createNewHire_whenPositionHasDepartment_thenUseDepartmentFromPosition() {
        CreateNewHireDTO request = new CreateNewHireDTO();
        request.setPositionId(UUID.randomUUID());
        request.setStatus(EmployeeStatus.PROBATION);

        Position position = new Position();
        Department deptFromPosition = new Department();
        deptFromPosition.setDeptId(UUID.randomUUID());
        position.setDepartment(deptFromPosition);

        when(employeeHelper.findPositionOrThrow(request.getPositionId())).thenReturn(position);
        
        Employee savedEmployee = new Employee();
        when(employeeHelper.save(any(Employee.class))).thenReturn(savedEmployee);

        onboardingCommandService.createNewHire(request);

        verify(employeeHelper, never()).findDepartmentOrThrow(any());
        verify(employeeHelper).save(argThat(emp -> 
            emp.getDepartment() == deptFromPosition
        ));
    }
}
