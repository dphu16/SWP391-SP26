package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.ReviewDetailsRequest;
import com.project.hrm.module.evaluation.entity.ReviewDetails;
import com.project.hrm.module.evaluation.entity.PerformanceReviews;
import com.project.hrm.module.evaluation.entity.EmployeeGoal;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.module.evaluation.repository.ReviewDetailsRepository;
import com.project.hrm.module.evaluation.repository.EmployeeGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ReviewDetailsService {
    private final ReviewDetailsRepository repository;
    private final PerformanceReviewsRepository reviewRepository;
    private final EmployeeGoalRepository goalRepository;

    public ReviewDetailsService(ReviewDetailsRepository repository,
                               PerformanceReviewsRepository reviewRepository,
                               EmployeeGoalRepository goalRepository) {
        this.repository = repository;
        this.reviewRepository = reviewRepository;
        this.goalRepository = goalRepository;
    }

    @Transactional
    public ReviewDetails create(ReviewDetailsRequest req){
        ReviewDetails detail = new ReviewDetails();
        detail.setScore(req.getScore());
        detail.setComment(req.getComment());

        PerformanceReviews review = reviewRepository.findById(req.getReviewId())
                .orElseThrow(() -> new RuntimeException("Performance review not found"));
        EmployeeGoal goal = goalRepository.findById(req.getGoalId())
                .orElseThrow(() -> new RuntimeException("Employee goal not found"));

        detail.setReview(review);
        detail.setGoal(goal);

        return repository.save(detail);
    }

    public List<ReviewDetails> getAll(){
        return repository.findAll();
    }

    public ReviewDetails getById(UUID detailId){
        return repository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Review detail not found"));
    }

    @Transactional
    public ReviewDetails update(UUID detailId, ReviewDetailsRequest req){
        ReviewDetails existing = getById(detailId);
        existing.setScore(req.getScore());
        existing.setComment(req.getComment());
        return repository.save(existing);
    }

    public void delete(UUID detailId){
        repository.deleteById(detailId);
    }
}

