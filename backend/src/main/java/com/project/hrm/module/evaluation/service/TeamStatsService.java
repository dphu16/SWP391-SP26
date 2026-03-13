package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.evaluation.dto.response.GlobalPerformanceStatsResponse;
import com.project.hrm.module.evaluation.dto.response.TeamStatsResponse;
import com.project.hrm.module.evaluation.dto.response.DepartmentScoreResponse;
import com.project.hrm.module.evaluation.enums.CycleStatus;
import com.project.hrm.module.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.Arrays;
import java.util.stream.Collectors;
import com.project.hrm.module.corehr.enums.EmployeeStatus;

@Service
public class TeamStatsService {

    private final EmployeeGoalRepository goalRepo;
    private final PerformanceReviewsRepository reviewRepo;
    private final PerformanceCyclesRepository cycleRepo;
    private final EmployeeRepository employeeRepo;
    private final DepartmentRepository deptRepo;

    public TeamStatsService(
            EmployeeGoalRepository goalRepo,
            PerformanceReviewsRepository reviewRepo,
            PerformanceCyclesRepository cycleRepo,
            EmployeeRepository employeeRepo,
            DepartmentRepository deptRepo) {
        this.goalRepo = goalRepo;
        this.reviewRepo = reviewRepo;
        this.cycleRepo = cycleRepo;
        this.employeeRepo = employeeRepo;
        this.deptRepo = deptRepo;
    }

    public TeamStatsResponse getStatsForManager(UUID managerId) {
        var activeCycle = cycleRepo.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE)
                .orElse(null);

        if (activeCycle == null)
            return new TeamStatsResponse(0, 0, null);

        Employee manager = employeeRepo.findById(managerId).orElse(null);
        if (manager == null || manager.getDepartment() == null) {
            return new TeamStatsResponse(0, 0, null);
        }

        UUID deptId = manager.getDepartment().getDeptId();
        List<Employee> team = employeeRepo.findByDepartment_DeptId(deptId).stream()
                .filter(e -> e.getEmployeeId() != null && !e.getEmployeeId().equals(managerId) && e.getStatus() == EmployeeStatus.OFFICIAL)
                .collect(Collectors.toList());

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
            return new GlobalPerformanceStatsResponse(0.0, 0.0, java.util.Collections.emptyList());

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

        // 3. Score Distribution (Bell Curve): Count staff in 10 bins (0-10, 11-20, ..., 91-100)
        List<Double> allScores = reviewRepo.findAllScoresByCycle(cycleId);
        Integer[] distribution = new Integer[10];
        Arrays.fill(distribution, 0);
        
        if (allScores != null) {
            for (Double score : allScores) {
                int bin = (int) (score / 10);
                if (bin >= 10) bin = 9; // Handle 100 correctly
                if (bin < 0) bin = 0;
                distribution[bin]++;
            }
        }

        return new GlobalPerformanceStatsResponse(orgAvg, totalTarget, Arrays.asList(distribution));
    }

    public List<DepartmentScoreResponse> getDepartmentLeaderboard() {
        var activeCycle = cycleRepo.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE)
                .orElse(null);

        if (activeCycle == null) {
            return Collections.emptyList();
        }

        UUID cycleId = activeCycle.getCycleId();
        List<Department> allDepts = deptRepo.findAll();
        List<Object[]> scores = reviewRepo.findDepartmentAveragesWithNamesByCycle(cycleId);
        
        java.util.Map<String, Double> scoreMap = scores.stream()
                .collect(Collectors.toMap(
                        res -> (String) res[0],
                        res -> res[1] != null ? (Double) res[1] : 0.0,
                        (existing, replacement) -> existing
                ));

        return allDepts.stream()
                .map(dept -> new DepartmentScoreResponse(
                        dept.getDeptName(), 
                        scoreMap.getOrDefault(dept.getDeptName(), 0.0)
                ))
                .sorted((a, b) -> {
                    int compare = Double.compare(b.getAverageScore(), a.getAverageScore());
                    if (compare == 0) return a.getDepartmentName().compareTo(b.getDepartmentName());
                    return compare;
                })
                .collect(Collectors.toList());
    }
}
