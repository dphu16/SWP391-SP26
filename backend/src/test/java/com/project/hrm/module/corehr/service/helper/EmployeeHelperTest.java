package com.project.hrm.module.corehr.service.helper;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeHelperTest {

    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private PositionRepository positionRepository;

    @InjectMocks
    private EmployeeHelper employeeHelper;

    @Test
    void resolveManager_whenEmployeeHasDepartmentWithManager_thenReturnManager() {
        Employee employee = new Employee();
        Department department = new Department();
        Employee manager = new Employee();
        department.setManager(manager);
        employee.setDepartment(department);

        Employee result = employeeHelper.resolveManagerForEmployee(employee);

        assertEquals(manager, result);
    }

    @Test
    void resolveManager_whenEmployeeHasNoDepartment_thenThrowException() {
        Employee employee = new Employee();

        assertThrows(BusinessRuleException.class, () -> {
            employeeHelper.resolveManagerForEmployee(employee);
        });
    }

    @Test
    void resolveManager_whenDepartmentHasNoManager_thenThrowException() {
        Employee employee = new Employee();
        Department department = new Department();
        employee.setDepartment(department);

        assertThrows(BusinessRuleException.class, () -> {
            employeeHelper.resolveManagerForEmployee(employee);
        });
    }

    @Test
    void isManagerOf_whenApproverIsCorrectManager_thenReturnTrue() {
        Employee employee = new Employee();
        Department department = new Department();
        Employee manager = new Employee();
        manager.setEmployeeId(UUID.randomUUID());
        department.setManager(manager);
        employee.setDepartment(department);

        assertTrue(employeeHelper.isManagerOf(manager, employee));
    }

    @Test
    void isManagerOf_whenApproverIsManagerOfDifferentDept_thenReturnFalse() {
        Employee employee = new Employee();
        Department dept1 = new Department();
        Employee manager1 = new Employee();
        manager1.setEmployeeId(UUID.randomUUID());
        dept1.setManager(manager1);
        employee.setDepartment(dept1);

        Employee manager2 = new Employee();
        manager2.setEmployeeId(UUID.randomUUID());

        assertFalse(employeeHelper.isManagerOf(manager2, employee));
    }
}
