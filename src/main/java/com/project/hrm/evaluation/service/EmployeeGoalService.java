package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.repository.EmployeeGoalRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class EmployeeGoalService {
    private final EmployeeGoalRepository repository;

    public EmployeeGoalService(EmployeeGoalRepository repository) {
        this.repository = repository;
    }

    public EmployeeGoal assignKpi(UUID employeeId, UUID cycleId, UUID kpiLibId, String title,
                                  BigDecimal targetValue, BigDecimal currentValue){
        EmployeeGoal employee = new EmployeeGoal();
        employee.setEmployeeId(employeeId);
        employee.setCycleId(cycleId);
        employee.setKpiLibId(kpiLibId);
        employee.setTitle(title);
        employee.setTargetValue(targetValue);
        employee.setCurrentValue(currentValue);
        employee.setWeight(weight);
        employee.setStatus("DRAFT");
        return repository.save(employee);
    }
}
