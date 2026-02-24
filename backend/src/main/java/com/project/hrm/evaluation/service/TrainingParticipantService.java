package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.TrainingParticipantRequest;
import com.project.hrm.evaluation.entity.TrainingParticipant;
import com.project.hrm.evaluation.entity.TrainingSession;
import com.project.hrm.evaluation.repository.TrainingParticipantRepository;
import com.project.hrm.evaluation.repository.TrainingSessionRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TrainingParticipantService {
    private final TrainingParticipantRepository repository;
    private final TrainingSessionRepository sessionRepository;
    private final EmployeeRepository employeeRepository;

    public TrainingParticipantService(TrainingParticipantRepository repository,
                                     TrainingSessionRepository sessionRepository,
                                     EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.sessionRepository = sessionRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public TrainingParticipant create(TrainingParticipantRequest req){
        TrainingParticipant participant = new TrainingParticipant();
        participant.setAttendanceStatus(req.getAttendanceStatus());

        TrainingSession session = sessionRepository.findById(req.getSessionId())
                .orElseThrow(() -> new RuntimeException("Training session not found"));
        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        participant.setSession(session);
        participant.setEmployee(employee);

        return repository.save(participant);
    }

    public List<TrainingParticipant> getAll(){
        return repository.findAll();
    }

    public TrainingParticipant getById(UUID participantId){
        return repository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Training participant not found"));
    }

    @Transactional
    public TrainingParticipant update(UUID participantId, TrainingParticipantRequest req){
        TrainingParticipant existing = getById(participantId);
        existing.setAttendanceStatus(req.getAttendanceStatus());
        return repository.save(existing);
    }

    public void delete(UUID participantId){
        repository.deleteById(participantId);
    }
}

