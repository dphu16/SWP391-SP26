package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.evaluation.repository.KpiLibraryRepository;
import com.project.hrm.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class EmployeeGoalService {

    private final EmployeeGoalRepository goalRepository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceCyclesRepository cycleRepository;
    private final KpiLibraryRepository kpiLibraryRepository;

    public EmployeeGoalService(
            EmployeeGoalRepository goalRepository,
            EmployeeRepository employeeRepository,
            PerformanceCyclesRepository cycleRepository,
            KpiLibraryRepository kpiLibraryRepository) {
        this.goalRepository = goalRepository;
        this.employeeRepository = employeeRepository;
        this.cycleRepository = cycleRepository;
        this.kpiLibraryRepository = kpiLibraryRepository;
    }

    public EmployeeGoal assignKpi(
            UUID employeeId,
            UUID cycleId,
            UUID kpiLibId,
            String title,
            BigDecimal targetValue,
            BigDecimal currentValue,
            BigDecimal weight
    ) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        PerformanceCycles cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Performance cycle not found"));

        KpiLibrary kpiLibrary = kpiLibraryRepository.findById(kpiLibId)
                .orElseThrow(() -> new RuntimeException("KPI library not found"));

        EmployeeGoal goal = new EmployeeGoal();
        goal.setEmployee(employee);
        goal.setCycle(cycle);
        goal.setKpiLibrary(kpiLibrary);
        goal.setTitle(title);
        goal.setTargetValue(targetValue);
        goal.setCurrentValue(currentValue);
        goal.setWeight(weight);
        goal.setStatus("DRAFT");

        return goalRepository.save(goal);
    }
}
