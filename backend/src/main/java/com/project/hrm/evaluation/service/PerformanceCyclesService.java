package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.CycleStatusRequest;
import com.project.hrm.evaluation.dto.PerformanceCyclesRequest;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.enums.CycleStatus;
import com.project.hrm.evaluation.repository.PerformanceCyclesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PerformanceCyclesService {

    private final PerformanceCyclesRepository repository;

    public PerformanceCyclesService(PerformanceCyclesRepository repository) {
        this.repository = repository;
    }

    // Create cycle
    @Transactional
    public PerformanceCycles create(PerformanceCyclesRequest req) {

        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new RuntimeException("End date must be after start date");
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

        if (req.getEndDate().isBefore(req.getStartDate()))
            throw new RuntimeException("End date must be after start date");

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
