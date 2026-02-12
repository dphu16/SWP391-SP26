package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.entity.PerformanceRuleResults;
import com.project.hrm.evaluation.repository.PerformanceRuleResultsRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PerformanceRuleResultsService {
    private final PerformanceRuleResultsRepository repository;

    public PerformanceRuleResultsService(PerformanceRuleResultsRepository repository) {
        this.repository = repository;
    }

    public PerformanceRuleResults create(PerformanceRuleResults result){
        return repository.save(result);
    }

    public List<PerformanceRuleResults> getAll(){
        return repository.findAll();
    }

    public PerformanceRuleResults getById(UUID id){
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Performance rule result not found"));
    }

    public PerformanceRuleResults update(UUID id, PerformanceRuleResults data){
        PerformanceRuleResults existing = getById(id);
        if (data.getAppliedAction() != null) existing.setAppliedAction(data.getAppliedAction());
        if (data.getRule() != null) existing.setRule(data.getRule());
        if (data.getReview() != null) existing.setReview(data.getReview());
        return repository.save(existing);
    }

    public void delete(UUID id){
        repository.deleteById(id);
    }
}

