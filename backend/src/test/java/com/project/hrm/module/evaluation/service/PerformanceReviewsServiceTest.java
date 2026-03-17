package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import com.project.hrm.module.evaluation.dto.PerformanceReviewsRequest;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.entity.PerformanceReviews;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PerformanceReviewsServiceTest {

    @Mock
    private PerformanceReviewsRepository repository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private PerformanceCyclesRepository cycleRepository;
    @Mock
    private EmployeeHelper employeeHelper;

    @InjectMocks
    private PerformanceReviewsService performanceReviewsService;

    @Test
    void create_whenCalled_thenManagerIdResolvedFromDept() {
        PerformanceReviewsRequest dto = new PerformanceReviewsRequest();
        dto.setEmployeeId(UUID.randomUUID());
        dto.setCycleId(UUID.randomUUID());
        dto.setManagerId(UUID.randomUUID()); // Mock ID from frontend

        Employee employee = new Employee();
        Employee deptManager = new Employee();
        deptManager.setEmployeeId(UUID.randomUUID());

        when(employeeRepository.findById(dto.getEmployeeId())).thenReturn(Optional.of(employee));
        when(cycleRepository.findById(dto.getCycleId())).thenReturn(Optional.of(new PerformanceCycles()));
        when(employeeHelper.resolveManagerForEmployee(employee)).thenReturn(deptManager);
        when(repository.save(any(PerformanceReviews.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PerformanceReviews result = performanceReviewsService.create(dto);

        assertEquals(deptManager.getEmployeeId(), result.getManagerId());
        verify(employeeHelper).resolveManagerForEmployee(employee);
    }
}
