package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.*;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.entity.PerformanceReviews;
import com.project.hrm.evaluation.enums.ReviewStatus;
import com.project.hrm.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PerformanceReviewsService {

    private final PerformanceReviewsRepository repository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceCyclesRepository cycleRepository;

    public PerformanceReviewsService(
            PerformanceReviewsRepository repository,
            EmployeeRepository employeeRepository,
            PerformanceCyclesRepository cycleRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.cycleRepository = cycleRepository;
    }

    // API 13
    @Transactional
    public PerformanceReviews create(PerformanceReviewsRequest req){

        PerformanceReviews review = new PerformanceReviews();

        PerformanceCycles cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        review.setCycle(cycle);
        review.setEmployee(employee);
        review.setManagerId(req.getManagerId());
        review.setKpiScore(req.getKpiScore());
        review.setAttitudeScore(req.getAttitudeScore());
        review.setStatus(ReviewStatus.DRAFT);
        review.setCreatedAt(LocalDateTime.now());

        return repository.save(review);
    }

    // API 14
    public List<PerformanceReviews> getByEmployee(UUID employeeId){
        return repository.findByEmployee_EmployeeId(employeeId);
    }

    // API 15
    @Transactional
    public PerformanceReviews updateScore(UUID id, ReviewScoreRequest req){
        PerformanceReviews review = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        review.setKpiScore(req.getKpiScore());
        review.setAttitudeScore(req.getAttitudeScore());

        return repository.save(review);
    }

    // API 16
    @Transactional
    public PerformanceReviews finalizeReview(UUID id){

        PerformanceReviews review = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        double overall = (
                review.getKpiScore() * 0.7 +
                        review.getAttitudeScore() * 0.3
        );

        review.setOverallScore(overall);
        review.setStatus(ReviewStatus.SUBMITTED);

        return repository.save(review);
    }

    // API 17 (simple version)
    @Transactional
    public String createDecision(UUID reviewId, DecisionRequest req){

        PerformanceReviews review = repository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        review.setStatus(ReviewStatus.APPROVED);
        repository.save(review);

        return "Decision created: " + req.getType();
    }
}