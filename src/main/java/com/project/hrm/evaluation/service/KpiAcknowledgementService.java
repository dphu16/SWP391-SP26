package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.KpiAcknowledgementRequest;
import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import com.project.hrm.evaluation.repository.KpiAcknowledgementRepository;
import com.project.hrm.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class KpiAcknowledgementService {
    private final KpiAcknowledgementRepository repository;
    private final EmployeeGoalRepository goalRepository;
    private final EmployeeRepository employeeRepository;

    public KpiAcknowledgementService(KpiAcknowledgementRepository repository,
                                    EmployeeGoalRepository goalRepository,
                                    EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.goalRepository = goalRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public KpiAcknowledgement create(KpiAcknowledgementRequest req){
        KpiAcknowledgement ack = new KpiAcknowledgement();
        ack.setConfirmed(req.getIsConfirmed());

        EmployeeGoal goal = goalRepository.findById(req.getGoalId())
                .orElseThrow(() -> new RuntimeException("Employee goal not found"));
        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        ack.setGoal(goal);
        ack.setEmployee(employee);

        return repository.save(ack);
    }

    public List<KpiAcknowledgement> getAll(){
        return repository.findAll();
    }

    public KpiAcknowledgement getById(UUID ackId){
        return repository.findById(ackId)
                .orElseThrow(() -> new RuntimeException("KPI acknowledgement not found"));
    }

    @Transactional
    public KpiAcknowledgement update(UUID ackId, KpiAcknowledgementRequest req){
        KpiAcknowledgement existing = getById(ackId);
        existing.setConfirmed(req.getIsConfirmed());

        if (Boolean.TRUE.equals(req.getIsConfirmed())){
            existing.setConfirmedAt(OffsetDateTime.now());
        }

        return repository.save(existing);
    }

    public void delete(UUID ackId){
        repository.deleteById(ackId);
    }

    @Transactional
    public KpiAcknowledgement confirm(EmployeeGoal goalId, Employee employeeId){
        KpiAcknowledgement ack = repository.findByGoalIdAndEmployeeId(goalId, employeeId)
                .orElseThrow(() -> new RuntimeException("KPI acknowledgement not found"));

        if (Boolean.TRUE.equals(ack.getConfirmed())){
            throw new RuntimeException("Kpi already confirmed");
        }

        ack.setConfirmed(true);
        ack.setConfirmedAt(OffsetDateTime.now());
        return repository.save(ack);

    }
}
