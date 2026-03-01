package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.response.TeamStatsResponse;
import com.project.hrm.module.evaluation.enums.CycleStatus;
import com.project.hrm.module.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import com.project.hrm.module.evaluation.dto.response.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TeamStatsService {

    private final EmployeeGoalRepository goalRepo;
    private final PerformanceReviewsRepository reviewRepo;
    private final PerformanceCyclesRepository cycleRepo;
    private final EmployeeRepository employeeRepo;

    public TeamStatsService(
            EmployeeGoalRepository goalRepo,
            PerformanceReviewsRepository reviewRepo,
            PerformanceCyclesRepository cycleRepo,
            EmployeeRepository employeeRepo) {
        this.goalRepo = goalRepo;
        this.reviewRepo = reviewRepo;
        this.cycleRepo = cycleRepo;
        this.employeeRepo = employeeRepo;
    }

    public TeamStatsResponse getStatsForManager(UUID managerId) {
        var activeCycle = cycleRepo.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE)
                .orElse(null);

        if (activeCycle == null)
            return new TeamStatsResponse(0, 0, null);

        List<Employee> team = employeeRepo.findByManager_EmployeeId(managerId);
        long totalMembers = team.size();

        if (totalMembers == 0)
            return new TeamStatsResponse(0, 0, null);

        List<UUID> teamIds = team.stream().map(Employee::getEmployeeId).collect(Collectors.toList());
        UUID cycleId = activeCycle.getCycleId();

        // Employees who have submitted at least 1 goal (submitted evidence)
        long submittedMembers = goalRepo.countDistinctSubmittedEmployees(teamIds, cycleId);

        // Average overallScore from performance_reviews
        Double avgScore = reviewRepo.avgOverallScoreByTeamAndCycle(teamIds, cycleId);

        return new TeamStatsResponse(totalMembers, submittedMembers, avgScore);
    }

    public GlobalPerformanceStatsResponse getGlobalPerformanceStats() {
        var activeCycle = cycleRepo.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE)
                .orElse(null);

        if (activeCycle == null)
            return new GlobalPerformanceStatsResponse(0.0, 0.0);

        UUID cycleId = activeCycle.getCycleId();

        // 1. Org Average Score: Average of department averages
        List<Double> deptAverages = reviewRepo.findDepartmentAveragesByCycle(cycleId);
        Double orgAvg = 0.0;
        if (deptAverages != null && !deptAverages.isEmpty()) {
            orgAvg = deptAverages.stream().mapToDouble(d -> d).average().orElse(0.0);
        }

        // 2. Total KPIs Assigned: Sum of targetValue
        Double totalTarget = goalRepo.sumTargetValueByCycle(cycleId);
        if (totalTarget == null)
            totalTarget = 0.0;

        return new GlobalPerformanceStatsResponse(orgAvg, totalTarget);
    }
}
