package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import com.project.hrm.evaluation.repository.KpiAcknowledgementRepository;
import com.project.hrm.module.corehr.entity.Employee;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class KpiAcknowledgementService {
    private final KpiAcknowledgementRepository repository;


    public KpiAcknowledgementService(KpiAcknowledgementRepository repository) {
        this.repository = repository;
    }

    public KpiAcknowledgement confirm(EmployeeGoal goalId, Employee employeeId){
        KpiAcknowledgement ack =
                repository.findByGoalIdAndEmployeeId(goalId, employeeId).orElseThrow(() -> new RuntimeException("KPI " +
                        "acknowledgement not found"));

        if (Boolean.TRUE.equals(ack.getStatus())){
            throw new RuntimeException("Kpi already confirmed");
        }

        ack.setStatus(true);
        ack.setConfirmedAt(OffsetDateTime.now());
        return repository.save(ack);

    }
}
