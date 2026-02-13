package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.PerformanceRulesRequest;
import com.project.hrm.evaluation.entity.PerformanceRules;
import com.project.hrm.evaluation.repository.PerformanceRulesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PerformanceRulesService {
    private final PerformanceRulesRepository repository;

    public PerformanceRulesService(PerformanceRulesRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PerformanceRules create(PerformanceRulesRequest req){
        PerformanceRules rule = new PerformanceRules();
        rule.setRuleName(req.getRuleName());
        rule.setDescription(req.getDescription());
        rule.setCondition(req.getCondition());
        rule.setScore(req.getScore());
        return repository.save(rule);
    }

    public List<PerformanceRules> getAll(){
        return repository.findAll();
    }

    public PerformanceRules getById(UUID id){
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Performance rule not found"));
    }

    @Transactional
    public PerformanceRules update(UUID id, PerformanceRulesRequest req){
        PerformanceRules existing = getById(id);
        existing.setRuleName(req.getRuleName());
        existing.setDescription(req.getDescription());
        existing.setCondition(req.getCondition());
        existing.setScore(req.getScore());
        return repository.save(existing);
    }

    public void delete(UUID id){
        repository.deleteById(id);
    }
}

