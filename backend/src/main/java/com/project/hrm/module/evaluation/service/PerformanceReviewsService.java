package com.project.hrm.module.evaluation.service;


import com.project.hrm.module.evaluation.dto.DecisionRequest;
import com.project.hrm.module.evaluation.dto.PerformanceReviewsRequest;
import com.project.hrm.module.evaluation.dto.ReviewScoreRequest;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.entity.PerformanceReviews;
import com.project.hrm.module.evaluation.enums.CycleStatus;
import com.project.hrm.module.evaluation.enums.ReviewStatus;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.EmployeeRole;

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

        PerformanceCycles cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        PerformanceReviews review = new PerformanceReviews();
        review.setCycle(cycle);
        review.setEmployee(employee);
        review.setManagerId(req.getManagerId());
        review.setKpiScore(req.getKpiScore());
        review.setAttitudeScore(req.getAttitudeScore());
        review.setStatus(ReviewStatus.DRAFT);
        review.setCreatedAt(LocalDateTime.now());

        return repository.save(review);
    }

    // Get or create review for active cycle
    @Transactional
    public PerformanceReviews getOrCreateForActiveCycle(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDateTime now = LocalDateTime.now();

        // Strategy to find the most relevant cycle:
        // 1. ACTIVE cycles that cover today's date (Most recently created first)
        // 2. The most recently created ACTIVE cycle
        // 3. Fallback to the most recently created cycle of any status
        PerformanceCycles targetCycle = cycleRepository.findAll().stream()
                .filter(c -> c.getStatus() == CycleStatus.ACTIVE)
                .filter(c -> !now.isBefore(c.getStartDate().atStartOfDay()) && !now.isAfter(c.getEndDate().atTime(23, 59, 59)))
                .sorted(java.util.Comparator.comparing(PerformanceCycles::getCreatedAt).reversed())
                .findFirst()
                .orElseGet(() -> cycleRepository.findAll().stream()
                        .filter(c -> c.getStatus() == CycleStatus.ACTIVE)
                        .max(java.util.Comparator.comparing(PerformanceCycles::getCreatedAt))
                        .orElseGet(() -> cycleRepository.findAll().stream()
                                .max(java.util.Comparator.comparing(PerformanceCycles::getCreatedAt))
                                .orElseThrow(() -> new RuntimeException("No performance cycles configured"))));

        return repository.findByEmployee_EmployeeIdAndCycle_CycleId(employeeId, targetCycle.getCycleId())
                .orElseGet(() -> {
                    PerformanceReviews newReview = new PerformanceReviews();
                    newReview.setEmployee(employee);
                    newReview.setCycle(targetCycle);
                    newReview.setStatus(ReviewStatus.DRAFT);
                    newReview.setCreatedAt(LocalDateTime.now());
                    return repository.save(newReview);
                });
    }

    // API 14
    public List<PerformanceReviews> getByEmployee(UUID employeeId){
        return repository.findByEmployee_EmployeeId(employeeId);
    }

    public List<PerformanceReviews> getByCycle(UUID cycleId){
        return repository.findByCycle_CycleId(cycleId).stream()
                .filter(r -> r.getEmployee() != null 
                        && r.getEmployee().getStatus() == EmployeeStatus.OFFICIAL
                        && r.getEmployee().getUser() != null
                        && r.getEmployee().getUser().hasRole(EmployeeRole.ROLE_EMPLOYEE.name()))
                .collect(java.util.stream.Collectors.toList());
    }

    // API 15
    @Transactional
    public PerformanceReviews updateScore(UUID id, ReviewScoreRequest req){
        PerformanceReviews review = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        review.setKpiScore(req.getKpiScore());
        review.setAttitudeScore(req.getAttitudeScore());
        review.setRating(req.getRating());

        return repository.save(review);
    }

    // API 16
    @Transactional
    public PerformanceReviews finalizeReview(UUID id){

        PerformanceReviews review = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        double kpiWeight = (review.getCycle().getKpiWeight() != null ? review.getCycle().getKpiWeight() : 70.0) / 100.0;
        double attitudeWeight = (review.getCycle().getAttitudeWeight() != null ? review.getCycle().getAttitudeWeight() : 30.0) / 100.0;

        double overall = (
                review.getKpiScore() * kpiWeight +
                        review.getAttitudeScore() * attitudeWeight
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