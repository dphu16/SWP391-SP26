package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.CycleStatusRequest;
import com.project.hrm.module.evaluation.dto.PerformanceCyclesRequest;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.enums.CycleStatus;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
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
    public PerformanceCycles create(PerformanceCyclesRequest req){

        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new RuntimeException("End date must be after start date");
        }

        PerformanceCycles cycle = new PerformanceCycles();
        cycle.setCycleName(req.getCycleName());
        cycle.setStartDate(req.getStartDate());
        cycle.setEndDate(req.getEndDate());
        cycle.setStatus(CycleStatus.DRAFT);
        cycle.setCreatedAt(LocalDateTime.now());

        return repository.save(cycle);
    }

    // Get all cycles
    public List<PerformanceCycles> getAll(){
        return repository.findAll();
    }

    // Update status (DRAFT → ACTIVE → CLOSED)
    @Transactional
    public PerformanceCycles updateStatus(UUID id, CycleStatusRequest req){

        PerformanceCycles cycle = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        CycleStatus current = cycle.getStatus();
        CycleStatus next = req.getStatus();

        // validate flow
        if (current == CycleStatus.DRAFT && next != CycleStatus.ACTIVE)
            throw new RuntimeException("Must activate first");

        if (current == CycleStatus.ACTIVE && next != CycleStatus.CLOSED)
            throw new RuntimeException("Must close after active");

        cycle.setStatus(next);

        return repository.save(cycle);
    }}

