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
import java.util.UUID;

@Service
@Transactional
public class KpiAcknowledgementService{

    private final KpiAcknowledgementRepository acknowledgementRepository;
    private final EmployeeGoalRepository goalRepository;
    private final EmployeeRepository employeeRepository;

    public KpiAcknowledgementService(
            KpiAcknowledgementRepository acknowledgementRepository,
            EmployeeGoalRepository goalRepository,
            EmployeeRepository employeeRepository
    ) {
        this.acknowledgementRepository = acknowledgementRepository;
        this.goalRepository = goalRepository;
        this.employeeRepository = employeeRepository;
    }

    public KpiAcknowledgement acknowledge(UUID goalId, KpiAcknowledgementRequest request) {

        // 1️⃣ Check goal exists
        EmployeeGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Employee goal not found"));

        // 2️⃣ Check employee exists
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // 3️⃣ Check employee matches goal owner
        if (!goal.getEmployee().getEmployeeId().equals(employee.getEmployeeId())) {
            throw new RuntimeException("Employee does not match goal owner");
        }

        // 4️⃣ Check already acknowledged
        boolean exists = acknowledgementRepository.existsByGoal(goal);
        if (exists) {
            throw new RuntimeException("KPI already acknowledged");
        }

        // 5️⃣ Create acknowledgement
        KpiAcknowledgement ack = new KpiAcknowledgement();
        ack.setGoal(goal);
        ack.setEmployee(employee);
        ack.setConfirmed(true);
        ack.setConfirmedAt(OffsetDateTime.now());

        return acknowledgementRepository.save(ack);
    }
}