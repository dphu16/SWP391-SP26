package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.CompetencyProfilesRequest;
import com.project.hrm.evaluation.entity.CompetencyProfiles;
import com.project.hrm.evaluation.repository.CompetencyProfilesRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CompetencyProfilesService {
    private final CompetencyProfilesRepository repository;
    private final EmployeeRepository employeeRepository;

    public CompetencyProfilesService(CompetencyProfilesRepository repository,
                                    EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public CompetencyProfiles create(CompetencyProfilesRequest req){
        CompetencyProfiles profile = new CompetencyProfiles();
        profile.setSkillName(req.getSkillName());
        profile.setLevel(req.getLevel());
        profile.setLastAssessedDate(req.getLastAssessedDate());

        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        profile.setEmployee(employee);

        return repository.save(profile);
    }

    public List<CompetencyProfiles> getAll(){
        return repository.findAll();
    }

    public CompetencyProfiles getById(UUID profileId){
        return repository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Competency profile not found"));
    }

    @Transactional
    public CompetencyProfiles update(UUID profileId, CompetencyProfilesRequest req){
        CompetencyProfiles existing = getById(profileId);
        existing.setSkillName(req.getSkillName());
        existing.setLevel(req.getLevel());
        existing.setLastAssessedDate(req.getLastAssessedDate());
        return repository.save(existing);
    }

    public void delete(UUID profileId){
        repository.deleteById(profileId);
    }
}

