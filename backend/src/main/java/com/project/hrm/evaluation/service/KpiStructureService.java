package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.request.AssignKpiRequest;
import com.project.hrm.evaluation.dto.response.KpiLibraryResponse;
import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.entity.KpiStructure;
import com.project.hrm.evaluation.entity.KpiStructureDetail;
import com.project.hrm.evaluation.repository.KpiLibraryRepository;
import com.project.hrm.evaluation.repository.KpiStructureDetailRepository;
import com.project.hrm.evaluation.repository.KpiStructureRepository;
import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.enums.CycleStatus;
import com.project.hrm.evaluation.enums.GoalStatus;
import com.project.hrm.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class KpiStructureService {

    private final KpiStructureRepository structureRepository;
    private final KpiStructureDetailRepository detailRepository;
    private final KpiLibraryRepository libraryRepository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceCyclesRepository cycleRepository;
    private final EmployeeGoalRepository employeeGoalRepository;

    public KpiStructureService(KpiStructureRepository structureRepository,
                               KpiStructureDetailRepository detailRepository,
                               KpiLibraryRepository libraryRepository,
                               EmployeeRepository employeeRepository,
                               PerformanceCyclesRepository cycleRepository,
                               EmployeeGoalRepository employeeGoalRepository) {
        this.structureRepository = structureRepository;
        this.detailRepository = detailRepository;
        this.libraryRepository = libraryRepository;
        this.employeeRepository = employeeRepository;
        this.cycleRepository = cycleRepository;
        this.employeeGoalRepository = employeeGoalRepository;
    }

    @Transactional
    public KpiStructure assignKpisToDepartment(AssignKpiRequest request) {
        KpiStructure saved = saveStructureOnly(request);
        publishToEmployees(saved, request);
        return saved;
    }

    /** Saves the KPI structure template ONLY — does NOT publish to employee goals. */
    @Transactional
    public KpiStructure saveStructureOnly(AssignKpiRequest request) {
        KpiStructure structure = structureRepository.findByDepartmentId(request.getDepartmentId())
                .orElseGet(() -> {
                    KpiStructure newStructure = new KpiStructure();
                    newStructure.setDepartmentId(request.getDepartmentId());
                    newStructure.setStructureName(request.getStructureName() != null ? request.getStructureName() : "General KPI Structure");
                    newStructure.setCreatedAt(LocalDateTime.now());
                    return newStructure;
                });

        double totalWeight = request.getDetails() != null ?
                request.getDetails().stream().mapToDouble(AssignKpiRequest.KpiDetailDto::getWeight).sum() : 0.0;

        structure.setTotalWeight(totalWeight);
        KpiStructure savedStructure = structureRepository.save(structure);

        if (savedStructure.getStructureId() != null) {
            detailRepository.deleteByStructure_StructureId(savedStructure.getStructureId());
        }

        if (request.getDetails() != null) {
            for (AssignKpiRequest.KpiDetailDto dto : request.getDetails()) {
                KpiLibrary library = libraryRepository.findById(dto.getKpiLibraryId())
                        .orElseThrow(() -> new RuntimeException("KPI Library not found"));
                KpiStructureDetail detail = new KpiStructureDetail();
                detail.setStructure(savedStructure);
                detail.setKpiLibrary(library);
                detail.setWeight(dto.getWeight());
                detailRepository.save(detail);
            }
        }

        return savedStructure;
    }

    /** Publishes the saved KPI structure to employee goals for the active cycle.
     *  Smart upsert logic:
     *  - Existing goals for a KPI: update weight only (preserve targetValue, status, etc.)
     *  - New KPIs in structure: create fresh goal
     *  - KPIs removed from structure: delete their goals
     */
    @Transactional
    public void publishToEmployees(KpiStructure savedStructure, AssignKpiRequest request) {
        PerformanceCycles activeCycle = cycleRepository.findFirstByStatusOrderByCreatedAtDesc(CycleStatus.ACTIVE)
                .orElse(null);

        if (activeCycle == null) return;

        List<Employee> employees = employeeRepository.findByPosition_Department_DeptId(request.getDepartmentId());
        if (employees.isEmpty()) return;

        List<UUID> employeeIds = employees.stream().map(Employee::getEmployeeId).collect(Collectors.toList());

        // Collect the set of KPI lib IDs in the new structure
        List<UUID> newKpiLibIds = request.getDetails() == null ? List.of() :
                request.getDetails().stream()
                        .map(AssignKpiRequest.KpiDetailDto::getKpiLibraryId)
                        .collect(Collectors.toList());

        // Step 1: Remove goals whose KPI is no longer in the structure
        if (!newKpiLibIds.isEmpty()) {
            employeeGoalRepository.deleteByEmployee_EmployeeIdInAndCycle_CycleIdAndKpiLibrary_LibIdNotIn(
                    employeeIds, activeCycle.getCycleId(), newKpiLibIds);
        } else {
            // All KPIs removed → clear all goals for this cycle
            employeeGoalRepository.deleteByEmployee_EmployeeIdInAndCycle_CycleId(
                    employeeIds, activeCycle.getCycleId());
            return;
        }

        // Step 2: Upsert each KPI for each employee (with dedup for pre-existing duplicate rows)
        if (request.getDetails() != null) {
            for (Employee employee : employees) {
                for (AssignKpiRequest.KpiDetailDto dto : request.getDetails()) {
                    KpiLibrary library = libraryRepository.findById(dto.getKpiLibraryId()).orElse(null);
                    if (library == null) continue;

                    // Fetch ALL matching goals (may include pre-existing duplicates)
                    List<EmployeeGoal> allMatching = employeeGoalRepository
                            .findAllByEmployee_EmployeeIdAndCycle_CycleIdAndKpiLibrary_LibId(
                                    employee.getEmployeeId(),
                                    activeCycle.getCycleId(),
                                    library.getLibId());

                    if (allMatching.size() > 1) {
                        // Keep the one with highest targetValue (most valuable data), delete the rest
                        EmployeeGoal best = allMatching.stream()
                                .max(java.util.Comparator.comparingDouble(
                                        g -> g.getTargetValue() != null ? g.getTargetValue() : 0.0))
                                .get();
                        allMatching.stream()
                                .filter(g -> !g.getGoalId().equals(best.getGoalId()))
                                .forEach(employeeGoalRepository::delete);
                        best.setWeight(dto.getWeight());
                        employeeGoalRepository.save(best);

                    } else if (allMatching.size() == 1) {
                        // Normal case: update weight only, preserve target/status
                        EmployeeGoal goal = allMatching.get(0);
                        goal.setWeight(dto.getWeight());
                        employeeGoalRepository.save(goal);

                    } else {
                        // No existing goal: create fresh
                        EmployeeGoal goal = new EmployeeGoal();
                        goal.setEmployee(employee);
                        goal.setCycle(activeCycle);
                        goal.setKpiLibrary(library);
                        goal.setCurrentValue(0.0);
                        goal.setTargetValue(0.0);
                        goal.setWeight(dto.getWeight());
                        goal.setStatus(GoalStatus.ASSIGNED);
                        goal.setTitle(library.getName());
                        employeeGoalRepository.save(goal);
                    }
                }
            }
        }
    }

    public List<AssignKpiRequest.KpiDetailDto> getKpisByDepartment(UUID departmentId) {
        KpiStructure structure = structureRepository.findByDepartmentId(departmentId)
                .orElse(null);

        if (structure == null) return List.of();

        List<KpiStructureDetail> details = detailRepository.findByStructure_StructureId(structure.getStructureId());
        
        return details.stream().map(detail -> {
            AssignKpiRequest.KpiDetailDto dto = new AssignKpiRequest.KpiDetailDto();
            dto.setKpiLibraryId(detail.getKpiLibrary().getLibId());
            dto.setWeight(detail.getWeight());
            return dto;
        }).collect(Collectors.toList());
    }
}
