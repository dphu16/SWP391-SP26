package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.entity.PerformanceRules;
import com.project.hrm.evaluation.repository.PerformanceRulesRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PerformanceRulesService {
    private final PerformanceRulesRepository repository;

    public PerformanceRulesService(PerformanceRulesRepository repository) {
        this.repository = repository;
    }

    public PerformanceRules create(PerformanceRules rule){
        return repository.save(rule);
    }

    public List<PerformanceRules> getAll(){
        return repository.findAll();
    }

    public PerformanceRules getById(UUID id){
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Performance rule not found"));
    }

    public PerformanceRules update(UUID id, PerformanceRules data){
        PerformanceRules existing = getById(id);
        existing.setMinScore(data.getMinScore());
        existing.setMaxScore(data.getMaxScore());
        existing.setAction(data.getAction());
        return repository.save(existing);
    }

    public void delete(UUID id){
        repository.deleteById(id);
    }
}

