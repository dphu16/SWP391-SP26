package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.CycleStatusRequest;
import com.project.hrm.module.evaluation.dto.PerformanceCyclesRequest;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.enums.CycleStatus;
import com.project.hrm.module.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PerformanceCyclesService {

    private final PerformanceCyclesRepository repository;
    private final EmployeeGoalRepository goalRepository;

    public PerformanceCyclesService(PerformanceCyclesRepository repository, EmployeeGoalRepository goalRepository) {
        this.repository = repository;
        this.goalRepository = goalRepository;
    }

    // Create cycle
    @Transactional
    public PerformanceCycles create(PerformanceCyclesRequest req) {
        if (repository.existsByCycleNameIgnoreCase(req.getCycleName())) {
            throw new RuntimeException("This cycle name already exists. Please choose a different name.");
        }

        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new RuntimeException("End date must be after start date");
        }

        boolean hasOverlap = repository.findAll().stream().anyMatch(c ->
                !req.getStartDate().isAfter(c.getEndDate()) && !req.getEndDate().isBefore(c.getStartDate())
        );
        if (hasOverlap) {
            throw new RuntimeException("This cycle's time range overlaps with an existing cycle.");
        }

        PerformanceCycles cycle = new PerformanceCycles();
        cycle.setCycleName(req.getCycleName());
        cycle.setStartDate(req.getStartDate());
        cycle.setEndDate(req.getEndDate());
        cycle.setStatus(CycleStatus.ACTIVE); // New cycles start as ACTIVE (DB constraint: ACTIVE | CLOSED)
        cycle.setCreatedAt(LocalDateTime.now());

        return repository.save(cycle);
    }

    // Update cycle details (only if ACTIVE)
    @Transactional
    public PerformanceCycles update(UUID id, PerformanceCyclesRequest req) {

        PerformanceCycles cycle = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        if (cycle.getStatus() == CycleStatus.CLOSED)
            throw new RuntimeException("Cannot edit a closed cycle");

        // Rule: Only allow editing dates if NO goals have been assigned yet
        // Note: HR publishing a structure creates goals with targetValue = 0.
        // Manager assigning a target updates targetValue > 0.
        boolean isDateChanging = !cycle.getStartDate().equals(req.getStartDate()) || !cycle.getEndDate().equals(req.getEndDate());
        if (isDateChanging) {
            boolean hasAssignedTargets = goalRepository.findAll().stream()
                    .anyMatch(g -> g.getCycle().getCycleId().equals(id) && g.getTargetValue() != null && g.getTargetValue() > 0);
            if (hasAssignedTargets) {
                throw new RuntimeException("Cannot modify the timeframe because specific targets have already been assigned (Target Value > 0). Please delete the assigned targets before changing the timeframe.");
            }
        }

        if (req.getEndDate().isBefore(req.getStartDate()))
            throw new RuntimeException("End date must be after start date");

        boolean hasOverlap = repository.findAll().stream()
                .filter(c -> !c.getCycleId().equals(id)) // exclude current cycle
                .anyMatch(c -> !req.getStartDate().isAfter(c.getEndDate()) && !req.getEndDate().isBefore(c.getStartDate())
        );
        if (hasOverlap) {
            throw new RuntimeException("The updated timeframe overlaps with another existing cycle.");
        }

        if (repository.existsByCycleNameIgnoreCaseAndCycleIdNot(req.getCycleName(), id)) {
            throw new RuntimeException("The updated cycle name already exists. Please choose a different name.");
        }

        cycle.setCycleName(req.getCycleName());
        cycle.setStartDate(req.getStartDate());
        cycle.setEndDate(req.getEndDate());

        return repository.save(cycle);
    }

    // Get all cycles
    public List<PerformanceCycles> getAll() {
        return repository.findAll();
    }

    // Update status (ACTIVE → CLOSED)
    @Transactional
    public PerformanceCycles updateStatus(UUID id, CycleStatusRequest req) {

        PerformanceCycles cycle = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        CycleStatus next = req.getStatus();

        if (cycle.getStatus() == CycleStatus.ACTIVE && next != CycleStatus.CLOSED)
            throw new RuntimeException("Can only close an active cycle");

        if (cycle.getStatus() == CycleStatus.CLOSED)
            throw new RuntimeException("Cycle is already closed");

        cycle.setStatus(next);
        return repository.save(cycle);
    }
}
