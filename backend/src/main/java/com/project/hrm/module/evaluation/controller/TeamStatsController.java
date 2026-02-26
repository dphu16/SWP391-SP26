package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.response.*;
import com.project.hrm.module.evaluation.service.TeamStatsService;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/manager")
public class TeamStatsController {

    private final TeamStatsService statsService;
    private final EmployeeRepository employeeRepo;

    public TeamStatsController(TeamStatsService statsService, EmployeeRepository employeeRepo) {
        this.statsService = statsService;
        this.employeeRepo = employeeRepo;
    }

    @GetMapping("/team-stats")
    public ResponseEntity<TeamStatsResponse> getTeamStats() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Employee manager = employeeRepo.findByUser_Username(auth.getName()).orElse(null);
        if (manager == null) {
            return ResponseEntity.ok(new TeamStatsResponse(0, 0, null));
        }
        return ResponseEntity.ok(statsService.getStatsForManager(manager.getEmployeeId()));
    }

    @GetMapping("/hr/stats")
    public ResponseEntity<GlobalPerformanceStatsResponse> getGlobalStats() {
        return ResponseEntity.ok(statsService.getGlobalPerformanceStats());
    }
}
