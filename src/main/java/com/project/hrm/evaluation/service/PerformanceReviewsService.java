package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.entity.PerformanceReviews;
import com.project.hrm.evaluation.repository.PerformanceReviewsRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PerformanceReviewsService {
    private final PerformanceReviewsRepository repository;

    public PerformanceReviewsService(PerformanceReviewsRepository repository) {
        this.repository = repository;
    }

    public PerformanceReviews create(PerformanceReviews review){
        return repository.save(review);
    }

    public List<PerformanceReviews> getAll(){
        return repository.findAll();
    }

    public PerformanceReviews getById(UUID id){
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Performance review not found"));
    }

    public PerformanceReviews update(UUID id, PerformanceReviews data){
        PerformanceReviews existing = getById(id);
        existing.setFinalScore(data.getFinalScore());
        existing.setRating(data.getRating());
        existing.setStatus(data.getStatus());
        // Optionally update manager/employee/cycle if provided
        if (data.getManager() != null) existing.setManager(data.getManager());
        if (data.getEmployee() != null) existing.setEmployee(data.getEmployee());
        if (data.getCycle() != null) existing.setCycle(data.getCycle());
        return repository.save(existing);
    }

    public void delete(UUID id){
        repository.deleteById(id);
    }
}

