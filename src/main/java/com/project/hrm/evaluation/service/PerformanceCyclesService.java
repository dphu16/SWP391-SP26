package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.repository.PerformanceCyclesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PerformanceCyclesService {
    private final PerformanceCyclesRepository repository;

    public PerformanceCyclesService(PerformanceCyclesRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PerformanceCycles create(PerformanceCycles cycle){
        return repository.save(cycle);
    }

    public List<PerformanceCycles> getAll(){
        return repository.findAll();
    }

    public PerformanceCycles getById(UUID id){
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Performance cycle not found"));
    }

    @Transactional
    public PerformanceCycles update(UUID id, PerformanceCycles data){
        PerformanceCycles existing = getById(id);
        existing.setNameCycle(data.getNameCycle());
        existing.setDateStart(data.getDateStart());
        existing.setDateEnd(data.getDateEnd());
        existing.setStatus(data.getStatus());
        return repository.save(existing);
    }

    public void delete(UUID id){
        repository.deleteById(id);
    }
}

