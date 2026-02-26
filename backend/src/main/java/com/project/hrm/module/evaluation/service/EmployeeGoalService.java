package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.EmployeeGoalRequest;
import com.project.hrm.module.evaluation.dto.GoalStatusRequest;
import com.project.hrm.module.evaluation.entity.EmployeeGoal;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.entity.KpiLibrary;
import com.project.hrm.module.evaluation.enums.GoalStatus;
import com.project.hrm.module.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.evaluation.repository.KpiLibraryRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

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

    // API 9 - Gán hoặc Cập nhật KPI cho nhân viên
    @Transactional
    public EmployeeGoal assign(EmployeeGoalRequest req){

        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        PerformanceCycles cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        KpiLibrary kpi = kpiLibraryRepository.findById(req.getKpiLibraryId())
                .orElseThrow(() -> new RuntimeException("KPI not found"));

        // ƯU TIÊN FILE 1: Kiểm tra trùng lặp dựa trên Unique Constraint
        Optional<EmployeeGoal> existing = repository.findByEmployee_EmployeeIdAndCycle_CycleIdAndKpiLibrary_LibId(
                employee.getEmployeeId(), cycle.getCycleId(), kpi.getLibId());

        EmployeeGoal goal;
        if (existing.isPresent()) {
            goal = existing.get();
            // Chỉ cho phép cập nhật thông tin nếu mục tiêu chưa bắt đầu thực hiện
            if (goal.getStatus() != GoalStatus.ASSIGNED) {
                throw new RuntimeException("Cannot update confirmed or in-progress goal.");
            }
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

    // API 10 - Lấy danh sách mục tiêu
    public List<EmployeeGoal> getByEmployee(UUID employeeId){
        return repository.findByEmployee_EmployeeId(employeeId);
    }

    // API 11 - Cập nhật trạng thái (Luồng phê duyệt)
    @Transactional
    public EmployeeGoal updateStatus(UUID id, GoalStatusRequest req){

        EmployeeGoal goal = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        GoalStatus current = goal.getStatus();
        GoalStatus next = req.getStatus();

        // Validate flow - Đảm bảo đi đúng quy trình
        validateStatusTransition(current, next);

        goal.setStatus(next);

        if (next == GoalStatus.SUBMITTED) {
            goal.setSubmittedAt(LocalDateTime.now());
        }

        return repository.save(goal);
    }

    // Tách logic kiểm tra quy trình ra hàm riêng cho sạch code
    private void validateStatusTransition(GoalStatus current, GoalStatus next) {
        if (current == GoalStatus.ASSIGNED && next != GoalStatus.CONFIRMED)
            throw new RuntimeException("Must CONFIRM first");

        if (current == GoalStatus.CONFIRMED && next != GoalStatus.IN_PROGRESS)
            throw new RuntimeException("Must move to IN_PROGRESS");

        if (current == GoalStatus.IN_PROGRESS && next != GoalStatus.SUBMITTED)
            throw new RuntimeException("Must SUBMIT after progress");

        if (current == GoalStatus.SUBMITTED && next != GoalStatus.APPROVED)
            throw new RuntimeException("Must APPROVE after submission");
    }
}