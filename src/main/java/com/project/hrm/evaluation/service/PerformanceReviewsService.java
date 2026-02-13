package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.PerformanceReviewsRequest;
import com.project.hrm.evaluation.entity.PerformanceReviews;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.evaluation.repository.PerformanceCyclesRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PerformanceReviewsService {
    private final PerformanceReviewsRepository repository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceCyclesRepository cycleRepository;

    public PerformanceReviewsService(PerformanceReviewsRepository repository,
                                   EmployeeRepository employeeRepository,
                                   PerformanceCyclesRepository cycleRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.cycleRepository = cycleRepository;
    }

    @Transactional
    public PerformanceReviews create(PerformanceReviewsRequest req){
        PerformanceReviews review = new PerformanceReviews();
        review.setOverallScore(req.getOverallScore());
        review.setStatus(req.getStatus());

        // Set relationships
        PerformanceCycles cycle = cycleRepository.findById(req.getCycleId())
                .orElseThrow(() -> new RuntimeException("Performance cycle not found"));
        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        Employee manager = employeeRepository.findById(req.getManagerId())
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        review.setCycle(cycle);
        review.setEmployee(employee);
        review.setManager(manager);

        return repository.save(review);
    }

    public List<PerformanceReviews> getAll(){
        return repository.findAll();
    }

    public PerformanceReviews getById(UUID id){
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Performance review not found"));
    }

    @Transactional
    public PerformanceReviews update(UUID id, PerformanceReviewsRequest req){
        PerformanceReviews existing = getById(id);
        existing.setOverallScore(req.getOverallScore());
        existing.setStatus(req.getStatus());
        // Optionally update manager/employee/cycle if provided
        if (req.getManagerId() != null) {
            Employee manager = employeeRepository.findById(req.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
            existing.setManager(manager);
        }
        if (req.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(req.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            existing.setEmployee(employee);
        }
        if (req.getCycleId() != null) {
            PerformanceCycles cycle = cycleRepository.findById(req.getCycleId())
                    .orElseThrow(() -> new RuntimeException("Performance cycle not found"));
            existing.setCycle(cycle);
        }
        return repository.save(existing);
    }

    public void delete(UUID id){
        repository.deleteById(id);
    }
}

