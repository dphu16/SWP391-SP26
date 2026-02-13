package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.EmployeeGoalRequest;
import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.evaluation.repository.KpiLibraryRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EmployeeGoalService {
    private final EmployeeGoalRepository repository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceCyclesRepository cycleRepository;
    private final KpiLibraryRepository kpiRepository;

    public EmployeeGoalService(EmployeeGoalRepository repository,
                             EmployeeRepository employeeRepository,
                             PerformanceCyclesRepository cycleRepository,
                             KpiLibraryRepository kpiRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.cycleRepository = cycleRepository;
        this.kpiRepository = kpiRepository;
    }

    @Transactional
    public EmployeeGoal create(EmployeeGoalRequest req){
        EmployeeGoal goal = new EmployeeGoal();
        goal.setTitle(req.getTitle());
        goal.setTargetValue(req.getTargetValue());
        goal.setWeight(req.getWeight());
        goal.setStatus(req.getStatus());

        // Set relationships
        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        PerformanceCycles cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new RuntimeException("Performance cycle not found"));
        KpiLibrary kpi = kpiRepository.findById(req.getKpiLibraryId())
                .orElseThrow(() -> new RuntimeException("KPI library not found"));

        goal.setEmployee(employee);
        goal.setCycle(cycle);
        goal.setKpiLibrary(kpi);

        return repository.save(goal);
    }

    public List<EmployeeGoal> getAll(){
        return repository.findAll();
    }

    public EmployeeGoal getById(UUID goalId){
        return repository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Employee goal not found"));
    }

    public List<EmployeeGoal> getByEmployeeId(UUID employeeId){
        return repository.findByEmployeeEmployeeId(employeeId);
    }

    @Transactional
    public EmployeeGoal update(UUID goalId, EmployeeGoalRequest req){
        EmployeeGoal existing = getById(goalId);
        existing.setTitle(req.getTitle());
        existing.setTargetValue(req.getTargetValue());
        existing.setWeight(req.getWeight());
        existing.setStatus(req.getStatus());
        return repository.save(existing);
    }

    public void delete(UUID goalId){
        repository.deleteById(goalId);
    }
}

