package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.EmployeeGoalRequest;
import com.project.hrm.evaluation.dto.GoalStatusRequest;
import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.enums.GoalStatus;
import com.project.hrm.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.evaluation.repository.KpiLibraryRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class EmployeeGoalService {

    private final EmployeeGoalRepository repository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceCyclesRepository cycleRepository;
    private final KpiLibraryRepository kpiLibraryRepository;

    public EmployeeGoalService(
            EmployeeGoalRepository repository,
            EmployeeRepository employeeRepository,
            PerformanceCyclesRepository cycleRepository,
            KpiLibraryRepository kpiLibraryRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.cycleRepository = cycleRepository;
        this.kpiLibraryRepository = kpiLibraryRepository;
    }

    // API 9 - Assign KPI to employee (upsert: update targetValue if exists, create if not; dedup if multiple)
    @Transactional
    public EmployeeGoal assign(EmployeeGoalRequest req){

        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        PerformanceCycles cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        KpiLibrary kpi = kpiLibraryRepository.findById(req.getKpiLibraryId())
                .orElseThrow(() -> new RuntimeException("KPI not found"));

        // Use findAll to safely handle pre-existing duplicate rows
        List<EmployeeGoal> allMatching = repository.findAllByEmployee_EmployeeIdAndCycle_CycleIdAndKpiLibrary_LibId(
                employee.getEmployeeId(), cycle.getCycleId(), kpi.getLibId());

        EmployeeGoal goal;
        if (allMatching.size() > 1) {
            // Dedup: keep the one with highest targetValue, delete the rest
            goal = allMatching.stream()
                    .max(java.util.Comparator.comparingDouble(
                            g -> g.getTargetValue() != null ? g.getTargetValue() : 0.0))
                    .get();
            allMatching.stream()
                    .filter(g -> !g.getGoalId().equals(goal.getGoalId()))
                    .forEach(repository::delete);
            repository.flush();
        } else if (allMatching.size() == 1) {
            goal = allMatching.get(0);
        } else {
            goal = new EmployeeGoal();
            goal.setEmployee(employee);
            goal.setCycle(cycle);
            goal.setKpiLibrary(kpi);
            goal.setCurrentValue(0.0);
            goal.setStatus(GoalStatus.ASSIGNED);
        }

        goal.setTitle(req.getTitle());
        goal.setTargetValue(req.getTargetValue());
        goal.setWeight(req.getWeight());
        goal.setAssignedBy(req.getAssignedBy());

        return repository.save(goal);
    }

    // API 10 - Get employee goals
    public List<EmployeeGoal> getByEmployee(UUID employeeId){
        return repository.findByEmployee_EmployeeId(employeeId);
    }

    // API 11 - Update status
    @Transactional
    public EmployeeGoal updateStatus(UUID id, GoalStatusRequest req){

        EmployeeGoal goal = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        GoalStatus current = goal.getStatus();
        GoalStatus next = req.getStatus();

        // Validate flow
        if (current == GoalStatus.ASSIGNED && next != GoalStatus.CONFIRMED)
            throw new RuntimeException("Must CONFIRM first");

        if (current == GoalStatus.CONFIRMED && next != GoalStatus.IN_PROGRESS)
            throw new RuntimeException("Must move to IN_PROGRESS");

        if (current == GoalStatus.IN_PROGRESS && next != GoalStatus.SUBMITTED)
            throw new RuntimeException("Must SUBMIT after progress");

        if (current == GoalStatus.SUBMITTED && next != GoalStatus.APPROVED)
            throw new RuntimeException("Must APPROVE after submission");

        goal.setStatus(next);

        if (next == GoalStatus.SUBMITTED) {
            goal.setSubmittedAt(LocalDateTime.now());
        }

        return repository.save(goal);
    }
}