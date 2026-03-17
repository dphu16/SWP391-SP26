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
                .orElseThrow(() -> new RuntimeException("KPI does not exist"));

        // Rule: Cycle must be ACTIVE (Requirement 1 & 6)
        if (cycle.getStatus() != com.project.hrm.module.evaluation.enums.CycleStatus.ACTIVE) {
            throw new RuntimeException("KPIs can only be assigned when the evaluation cycle is ACTIVE");
        }

        // Rule: Current date must be within cycle duration (Requirement 6 - Period check)
        java.time.LocalDate now = java.time.LocalDate.now();
        if (now.isBefore(cycle.getStartDate())) {
            throw new RuntimeException("Cycle '" + cycle.getCycleName() + "' has not started yet (Starts on: " + cycle.getStartDate() + "). Cannot assign goals.");
        }
        if (now.isAfter(cycle.getEndDate())) {
            throw new RuntimeException("Cycle '" + cycle.getCycleName() + "' expired on " + cycle.getEndDate() + ". Cannot assign goals.");
        }

        // Rule: Employee must be OFFICIAL and not TERMINATED (Requirement 2)
        if (employee.getStatus() != com.project.hrm.module.corehr.enums.EmployeeStatus.OFFICIAL) {
            throw new RuntimeException("KPIs can only be assigned to OFFICIAL employees");
        }

        if (employee.getStatus() == com.project.hrm.module.corehr.enums.EmployeeStatus.TERMINATED) {
            throw new RuntimeException("Cannot assign KPIs to TERMINATED employees");
        }

        // Rule: Validate Weight (Requirement 4)
        if (req.getWeight() == null || req.getWeight() <= 0) {
            throw new RuntimeException("KPI Weight must be greater than 0");
        }

        // Check if total weight exceeds 100%
        Double currentTotalWeight = repository.findAllByEmployee_EmployeeIdAndCycle_CycleId(employee.getEmployeeId(), cycle.getCycleId())
                .stream()
                .filter(g -> !g.getKpiLibrary().getLibId().equals(kpi.getLibId()))
                .mapToDouble(g -> g.getWeight() != null ? g.getWeight() : 0.0)
                .sum();

        if (currentTotalWeight + req.getWeight() > 100.001) { // Floating point safety
            throw new RuntimeException("Total KPI weight cannot exceed 100%. Currently at: " + currentTotalWeight + "%");
        }

        // Find the assigning Employee
        Employee assigner = null;
        if (principal != null) {
            assigner = employeeRepository.findByUser_Email(principal.getName()).orElse(null);
        }
        
        // Fallback to request's assignedBy if not found from principal
        if (assigner == null && req.getAssignedBy() != null) {
            assigner = employeeRepository.findById(req.getAssignedBy())
                    .orElseGet(() -> employeeRepository.findByUser_Email(req.getAssignedBy().toString()).orElse(null));
        }

        if (assigner == null) {
            throw new RuntimeException("Assigner information not found");
        }

        // Rule 1.1: Employee must belong to the assigning Manager's team (Same department or direct reporting line)
        boolean inSameDepartment = employee.getDepartment() != null 
                && assigner.getDepartment() != null 
                && employee.getDepartment().getDeptId().equals(assigner.getDepartment().getDeptId());
                
        boolean isDirectManager = employee.getManager() != null 
                && employee.getManager().getEmployeeId().equals(assigner.getEmployeeId());

        if (!inSameDepartment && !isDirectManager) {
            throw new RuntimeException("Only managers in the same department or direct managers have the authority to assign KPIs to this employee");
        }

        // Rule 1.2: KPI must exist within the employee's department KPI Structure
        if (employee.getDepartment() == null) {
            throw new RuntimeException("Employee has not been assigned to a department");
        }
        boolean isValidKpiForDept = kpiStructureDetailRepository.findByStructure_DepartmentId(employee.getDepartment().getDeptId())
                .stream()
                .anyMatch(detail -> detail.getKpiLibrary().getLibId().equals(kpi.getLibId()));
        if (!isValidKpiForDept) {
            throw new RuntimeException("This KPI does not belong to the employee's department category");
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
                    throw new RuntimeException("Target value for Percentage type is required and must be greater than 0");
                }
                if (req.getTargetValue() > 100) {
                    throw new RuntimeException("Target value for Percentage type cannot exceed 100");
                }
                goal.setTargetValue(req.getTargetValue());
                break;
            case NUMERIC:
            default:
                if (req.getTargetValue() == null || req.getTargetValue() <= 0) {
                    throw new RuntimeException("Target value is required and must be greater than 0");
                }
                goal.setTargetValue(req.getTargetValue());
                break;
        }

        return repository.save(goal);
    }

    // API 10 - Get employee goals (Active Cycle Only)
    public List<EmployeeGoal> getByEmployee(UUID employeeId){
        java.time.LocalDate now = java.time.LocalDate.now();
        
        PerformanceCycles activeCycle = cycleRepository.findAll().stream()
                .filter(c -> c.getStatus() == com.project.hrm.module.evaluation.enums.CycleStatus.ACTIVE)
                .filter(c -> !now.isBefore(c.getStartDate()) && !now.isAfter(c.getEndDate()))
                .findFirst()
                .orElse(null);

        // Fallback to most recent ACTIVE if none covers "now"
        if (activeCycle == null) {
            activeCycle = cycleRepository.findFirstByStatusOrderByCreatedAtDesc(com.project.hrm.module.evaluation.enums.CycleStatus.ACTIVE)
                    .orElse(null);
        }
                
        if (activeCycle == null) return List.of();
        
        return repository.findAllByEmployee_EmployeeIdAndCycle_CycleId(employeeId, activeCycle.getCycleId());
    }

    public List<EmployeeGoal> getByEmployeeAndCycle(UUID employeeId, UUID cycleId){
        return repository.findAllByEmployee_EmployeeIdAndCycle_CycleId(employeeId, cycleId);
    }

    // API 11 - Update status
    @Transactional
    public EmployeeGoal updateStatus(UUID id, GoalStatusRequest req){

        EmployeeGoal goal = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        GoalStatus current = goal.getStatus();
        GoalStatus next = req.getStatus();

        // New Rule: Cannot perform actions if cycle is CLOSED or outside date range
        if (goal.getCycle().getStatus() == com.project.hrm.module.evaluation.enums.CycleStatus.CLOSED) {
            throw new RuntimeException("This evaluation cycle is closed. Status changes cannot be performed.");
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        if (today.isBefore(goal.getCycle().getStartDate())) {
            throw new RuntimeException("The evaluation cycle has not started (Starts on: " + goal.getCycle().getStartDate() + ").");
        }
        if (today.isAfter(goal.getCycle().getEndDate())) {
            throw new RuntimeException("The evaluation cycle ended on " + goal.getCycle().getEndDate() + ".");
        }

        // Validate flow
        if (current == GoalStatus.ASSIGNED && next != GoalStatus.ACKNOWLEDGED)
            throw new RuntimeException("From ASSIGNED status, it can only transition to ACKNOWLEDGED (Employee acknowledges)");

        // Rule: Only allow ACKNOWLEDGED if targetValue exists and > 0
        if (next == GoalStatus.ACKNOWLEDGED && (goal.getTargetValue() == null || goal.getTargetValue() <= 0)) {
            throw new RuntimeException("This KPI cannot be acknowledged yet because the Manager has not assigned a Target Value. Please wait for the Manager's update.");
        }

        if (current == GoalStatus.ACKNOWLEDGED && next != GoalStatus.SUBMITTED)
            throw new RuntimeException("From ACKNOWLEDGED status, it can only transition to SUBMITTED (Employee performs and submits results)");

        if (current == GoalStatus.SUBMITTED && next != GoalStatus.COMPLETED && next != GoalStatus.ACKNOWLEDGED)
            throw new RuntimeException("From SUBMITTED status, the reviewer can only approve to COMPLETED or reject back to ACKNOWLEDGED");

        // Rejection logic (SUBMITTED -> ACKNOWLEDGED)
        if (current == GoalStatus.SUBMITTED && next == GoalStatus.ACKNOWLEDGED) {
            // Comment is now optional
        }

        goal.setStatus(next);
        if (req.getComment() != null) {
            goal.setReviewerComment(req.getComment());
        }

        if (next == GoalStatus.SUBMITTED) {
            java.time.LocalDate now = java.time.LocalDate.now();
            if (now.isAfter(goal.getCycle().getEndDate())) {
                throw new RuntimeException("Submission portal closed on " + goal.getCycle().getEndDate() + ". You cannot perform this action.");
            }
            goal.setSubmittedAt(LocalDateTime.now());
        }

        return repository.save(goal);
    }

    @Transactional
    public EmployeeGoal updateProgress(UUID id, GoalProgressRequest req) {
        EmployeeGoal goal = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (goal.getStatus() != GoalStatus.ACKNOWLEDGED && goal.getStatus() != GoalStatus.SUBMITTED) {
            throw new RuntimeException("Results can only be submitted when the goal is in ACKNOWLEDGED status");
        }

        // Rule: Cannot submit if cycle is CLOSED or outside date range
        if (goal.getCycle().getStatus() == com.project.hrm.module.evaluation.enums.CycleStatus.CLOSED) {
            throw new RuntimeException("This evaluation cycle is closed. Evidence cannot be submitted.");
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        if (today.isBefore(goal.getCycle().getStartDate())) {
            throw new RuntimeException("The evaluation cycle has not started. Evidence submission portal is not open yet.");
        }
        if (today.isAfter(goal.getCycle().getEndDate())) {
            throw new RuntimeException("Evidence submission portal closed on " + goal.getCycle().getEndDate() + ". Evaluation cycle has ended.");
        }

        // Rule: Mandatory evidence
        if (req.getImageUrl() == null || req.getImageUrl().isBlank()) {
            throw new RuntimeException("You must upload at least one evidence file to confirm your work results.");
        }

        // Rule: Actual Value mandatory
        if (req.getActualValue() == null) {
            throw new RuntimeException("Please enter the Actual Value.");
        }

        // Rule: Validation based on Measurement Type
        com.project.hrm.module.evaluation.enums.MeasurementType type = goal.getKpiLibrary().getMeasurementType();
        if (type == com.project.hrm.module.evaluation.enums.MeasurementType.PERCENTAGE) {
            if (req.getActualValue() < 0 || req.getActualValue() > 100) {
                throw new RuntimeException("For PERCENTAGE metric, the actual result must be between 0 and 100.");
            }
        } else if (type == com.project.hrm.module.evaluation.enums.MeasurementType.RATING) {
            if (req.getActualValue() < 1 || req.getActualValue() > 5) {
                throw new RuntimeException("For RATING metric, the actual result must be between 1 and 5.");
            }
        } else if (type == com.project.hrm.module.evaluation.enums.MeasurementType.BOOLEAN) {
            if (req.getActualValue() != 0 && req.getActualValue() != 1) {
                throw new RuntimeException("For BOOLEAN metric, the actual result can only be 0 (No) or 1 (Yes).");
            }
        }

        goal.setCurrentValue(req.getActualValue());
        
        if (req.getComment() != null) {
            goal.setEmployeeNote(req.getComment());
        }
        
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