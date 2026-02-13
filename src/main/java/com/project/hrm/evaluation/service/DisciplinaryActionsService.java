package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.DisciplinaryActionsRequest;
import com.project.hrm.evaluation.entity.DisciplinaryActions;
import com.project.hrm.evaluation.repository.DisciplinaryActionsRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DisciplinaryActionsService {
    private final DisciplinaryActionsRepository repository;
    private final EmployeeRepository employeeRepository;

    public DisciplinaryActionsService(DisciplinaryActionsRepository repository,
                                     EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public DisciplinaryActions create(DisciplinaryActionsRequest req){
        DisciplinaryActions action = new DisciplinaryActions();
        action.setType(req.getType());
        action.setReason(req.getReason());
        action.setIssueDate(req.getIssueDate());

        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        action.setEmployee(employee);

        return repository.save(action);
    }

    public List<DisciplinaryActions> getAll(){
        return repository.findAll();
    }

    public DisciplinaryActions getById(UUID actionId){
        return repository.findById(actionId)
                .orElseThrow(() -> new RuntimeException("Disciplinary action not found"));
    }

    @Transactional
    public DisciplinaryActions update(UUID actionId, DisciplinaryActionsRequest req){
        DisciplinaryActions existing = getById(actionId);
        existing.setType(req.getType());
        existing.setReason(req.getReason());
        existing.setIssueDate(req.getIssueDate());
        return repository.save(existing);
    }

    public void delete(UUID actionId){
        repository.deleteById(actionId);
    }
}

