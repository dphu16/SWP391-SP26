package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.response.*;
import com.project.hrm.module.evaluation.service.TeamStatsService;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.mapper.EmployeeMapper;
import java.util.List;
import java.util.Collections;
import java.util.stream.Collectors;

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

    @GetMapping("/my-team")
    public ResponseEntity<List<EmployeeDTO>> getMyTeam() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Employee manager = employeeRepo.findByUser_Username(auth.getName()).orElse(null);

        if (manager == null || manager.getDepartment() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Returns all employees in the SAME department
        List<Employee> teamMembers = employeeRepo.findByPosition_Department_DeptId(manager.getDepartment().getDeptId());

        List<EmployeeDTO> dtos = teamMembers.stream()
                .filter(e -> e.getEmployeeId() != null && !e.getEmployeeId().equals(manager.getEmployeeId()))
                .map(EmployeeMapper::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/hr/stats")
    public ResponseEntity<GlobalPerformanceStatsResponse> getGlobalStats() {
        return ResponseEntity.ok(statsService.getGlobalPerformanceStats());
    }
}
