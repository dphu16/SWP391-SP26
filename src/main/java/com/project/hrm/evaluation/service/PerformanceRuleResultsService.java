package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.PerformanceRuleResultsRequest;
import com.project.hrm.evaluation.entity.PerformanceRuleResults;
import com.project.hrm.evaluation.entity.PerformanceReviews;
import com.project.hrm.evaluation.entity.PerformanceRules;
import com.project.hrm.evaluation.repository.PerformanceRuleResultsRepository;
import com.project.hrm.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.evaluation.repository.PerformanceRulesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PerformanceRuleResultsService {
    private final PerformanceRuleResultsRepository repository;
    private final PerformanceReviewsRepository reviewRepository;
    private final PerformanceRulesRepository ruleRepository;

    public PerformanceRuleResultsService(PerformanceRuleResultsRepository repository,
                                        PerformanceReviewsRepository reviewRepository,
                                        PerformanceRulesRepository ruleRepository) {
        this.repository = repository;
        this.reviewRepository = reviewRepository;
        this.ruleRepository = ruleRepository;
    }

    @Transactional
    public PerformanceRuleResults create(PerformanceRuleResultsRequest req){
        PerformanceRuleResults result = new PerformanceRuleResults();
        result.setResultScore(req.getResultScore());

        // Set relationships
        PerformanceReviews review = reviewRepository.findById(req.getReviewId())
                .orElseThrow(() -> new RuntimeException("Performance review not found"));
        PerformanceRules rule = ruleRepository.findById(req.getRuleId())
                .orElseThrow(() -> new RuntimeException("Performance rule not found"));

        result.setReview(review);
        result.setRule(rule);

        return repository.save(result);
    }

    public List<PerformanceRuleResults> getAll(){
        return repository.findAll();
    }

    public PerformanceRuleResults getById(UUID id){
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Performance rule result not found"));
    }

    @Transactional
    public PerformanceRuleResults update(UUID id, PerformanceRuleResultsRequest req){
        PerformanceRuleResults existing = getById(id);
        existing.setResultScore(req.getResultScore());
        return repository.save(existing);
    }

    public void delete(UUID id){
        repository.deleteById(id);
    }
}

