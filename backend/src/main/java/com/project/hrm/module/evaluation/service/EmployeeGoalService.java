package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.EmployeeGoalRequest;
import com.project.hrm.module.evaluation.dto.GoalProgressRequest;
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

@Service
public class EmployeeGoalService {

    private final EmployeeGoalRepository repository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceCyclesRepository cycleRepository;
    private final KpiLibraryRepository kpiLibraryRepository;
    private final com.project.hrm.module.evaluation.repository.KpiStructureDetailRepository kpiStructureDetailRepository;
    private final com.project.hrm.module.corehr.repository.UserRepository userRepository;
    private final com.project.hrm.module.evaluation.repository.GoalEvidenceRepository goalEvidenceRepository;

    public EmployeeGoalService(
            EmployeeGoalRepository repository,
            EmployeeRepository employeeRepository,
            PerformanceCyclesRepository cycleRepository,
            KpiLibraryRepository kpiLibraryRepository,
            com.project.hrm.module.evaluation.repository.KpiStructureDetailRepository kpiStructureDetailRepository,
            com.project.hrm.module.corehr.repository.UserRepository userRepository,
            com.project.hrm.module.evaluation.repository.GoalEvidenceRepository goalEvidenceRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.cycleRepository = cycleRepository;
        this.kpiLibraryRepository = kpiLibraryRepository;
        this.kpiStructureDetailRepository = kpiStructureDetailRepository;
        this.userRepository = userRepository;
        this.goalEvidenceRepository = goalEvidenceRepository;
    }

    // API 9 - Assign KPI to employee (upsert: update targetValue if exists, create if not; dedup if multiple)
    @Transactional
    public EmployeeGoal assign(java.security.Principal principal, EmployeeGoalRequest req){

        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        PerformanceCycles cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        KpiLibrary kpi = kpiLibraryRepository.findById(req.getKpiLibraryId())
                .orElseThrow(() -> new RuntimeException("KPI not found"));

        // Find the assigning Employee
        Employee assigner = null;
        if (principal != null) {
            assigner = employeeRepository.findByUser_Username(principal.getName()).orElse(null);
        }
        
        // Fallback to request's assignedBy if not found from principal
        if (assigner == null && req.getAssignedBy() != null) {
            assigner = employeeRepository.findById(req.getAssignedBy())
                    .orElseGet(() -> employeeRepository.findByUser_Username(req.getAssignedBy().toString()).orElse(null));
        }

        if (assigner == null) {
            throw new RuntimeException("Không tìm thấy thông tin người giao KPI");
        }

        // Rule 1.1: Employee must belong to the assigning Manager's team (Same department or direct reporting line)
        boolean inSameDepartment = employee.getDepartment() != null 
                && assigner.getDepartment() != null 
                && employee.getDepartment().getDeptId().equals(assigner.getDepartment().getDeptId());
                
        boolean isDirectManager = employee.getManager() != null 
                && employee.getManager().getEmployeeId().equals(assigner.getEmployeeId());

        if (!inSameDepartment && !isDirectManager) {
            throw new RuntimeException("Chỉ quản lý cùng phòng ban hoặc quản lý trực tiếp mới có quyền gán KPI cho nhân viên này");
        }

        // Rule 1.2: KPI must exist within the employee's department KPI Structure
        if (employee.getDepartment() == null) {
            throw new RuntimeException("Nhân viên chưa được phân bổ phòng ban");
        }
        boolean isValidKpiForDept = kpiStructureDetailRepository.findByStructure_DepartmentId(employee.getDepartment().getDeptId())
                .stream()
                .anyMatch(detail -> detail.getKpiLibrary().getLibId().equals(kpi.getLibId()));
        if (!isValidKpiForDept) {
            throw new RuntimeException("KPI này không thuộc danh mục phòng ban của nhân viên");
        }

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
        goal.setWeight(req.getWeight());
        
        if (assigner != null) {
            goal.setAssignedBy(assigner.getEmployeeId());
        } else if (req.getAssignedBy() != null) {
            goal.setAssignedBy(req.getAssignedBy());
        }

        // Rule 2: Constraint handling based on Measurement Type metrics
        switch (kpi.getMeasurementType()) {
            case RATING:
                goal.setTargetValue(5.0);
                break;
            case BOOLEAN:
                goal.setTargetValue(1.0); // 1.0 represents True
                break;
            case PERCENTAGE:
                if (req.getTargetValue() == null || req.getTargetValue() <= 0) {
                    throw new RuntimeException("Target value của loại Percentage bắt buộc nhập và phải lớn hơn 0");
                }
                if (req.getTargetValue() > 100) {
                    throw new RuntimeException("Target value loại Percentage không được vượt quá 100");
                }
                goal.setTargetValue(req.getTargetValue());
                break;
            case NUMERIC:
            default:
                if (req.getTargetValue() == null || req.getTargetValue() <= 0) {
                    throw new RuntimeException("Target value bắt buộc nhập và phải lớn hơn 0");
                }
                goal.setTargetValue(req.getTargetValue());
                break;
        }

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
        if (current == GoalStatus.ASSIGNED && next != GoalStatus.ACKNOWLEDGED)
            throw new RuntimeException("Từ ASSIGNED chỉ có thể chuyển sang ACKNOWLEDGED (Nhân viên acknowledge / xác nhận)");

        if (current == GoalStatus.ACKNOWLEDGED && next != GoalStatus.SUBMITTED)
            throw new RuntimeException("Từ ACKNOWLEDGED chỉ có thể chuyển sang SUBMITTED (Nhân viên thực hiện và nộp kết quả)");

        if (current == GoalStatus.SUBMITTED && next != GoalStatus.COMPLETED && next != GoalStatus.ACKNOWLEDGED)
            throw new RuntimeException("Từ SUBMITTED người đánh giá chỉ có thể duyệt sang COMPLETED hoặc từ chối quay về ACKNOWLEDGED");

        goal.setStatus(next);

        if (next == GoalStatus.SUBMITTED) {
            goal.setSubmittedAt(LocalDateTime.now());
        }

        return repository.save(goal);
    }

    @Transactional
    public EmployeeGoal updateProgress(UUID id, GoalProgressRequest req) {
        EmployeeGoal goal = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (goal.getStatus() != GoalStatus.ACKNOWLEDGED && goal.getStatus() != GoalStatus.SUBMITTED) {
            throw new RuntimeException("Chỉ có thể nộp kết quả khi mục tiêu đang ở trạng thái ACKNOWLEDGED");
        }

        goal.setCurrentValue(req.getActualValue());
        
        if (req.getImageUrl() != null && !req.getImageUrl().isBlank()) {
            goal.setImageUrl(req.getImageUrl());
            com.project.hrm.module.evaluation.entity.GoalEvidence evidence = new com.project.hrm.module.evaluation.entity.GoalEvidence();
            evidence.setGoal(goal);
            evidence.setFileUrl(req.getImageUrl());
            evidence.setStatus(com.project.hrm.module.evaluation.enums.EvidenceStatus.PENDING);
            goalEvidenceRepository.save(evidence);
        }
        
        goal.setStatus(GoalStatus.SUBMITTED);
        goal.setSubmittedAt(LocalDateTime.now());

        return repository.save(goal);
    }
}