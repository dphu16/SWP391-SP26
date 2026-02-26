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

    @Transactional
    public PerformanceCycles create(PerformanceCyclesRequest req) {

        PerformanceCycles cycle = new PerformanceCycles();
        cycle.setCycleName(req.getCycleName());
        cycle.setStartDate(req.getStartDate());
        cycle.setEndDate(req.getEndDate());
        cycle.setStatus(CycleStatus.DRAFT);
        cycle.setCreatedAt(LocalDateTime.now());

        return repository.save(cycle);
    }

    public List<PerformanceCycles> getAll() {
        return repository.findAll();
    }

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

    @Transactional
    public PerformanceCycles updateStatus(UUID id, CycleStatusRequest req) {
        PerformanceCycles cycle = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        CycleStatus current = cycle.getStatus();
        CycleStatus next = req.getStatus();

        if (current == CycleStatus.DRAFT && next != CycleStatus.ACTIVE)

            if (current == CycleStatus.ACTIVE && next != CycleStatus.CLOSED)

                cycle.setStatus(next);
        return repository.save(cycle);
    }
}
