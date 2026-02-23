package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.TrainingSessionRequest;
import com.project.hrm.evaluation.entity.TrainingSession;
import com.project.hrm.evaluation.entity.TrainingCourse;
import com.project.hrm.evaluation.repository.TrainingSessionRepository;
import com.project.hrm.evaluation.repository.TrainingCourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TrainingSessionService {
    private final TrainingSessionRepository repository;
    private final TrainingCourseRepository courseRepository;

    public TrainingSessionService(TrainingSessionRepository repository,
                                 TrainingCourseRepository courseRepository) {
        this.repository = repository;
        this.courseRepository = courseRepository;
    }

    @Transactional
    public TrainingSession create(TrainingSessionRequest req){
        TrainingSession session = new TrainingSession();
        session.setStartDate(req.getStartDate());
        session.setEndDate(req.getEndDate());
        session.setLocation(req.getLocation());

        TrainingCourse course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new RuntimeException("Training course not found"));
        session.setCourse(course);

        return repository.save(session);
    }

    public List<TrainingSession> getAll(){
        return repository.findAll();
    }

    public TrainingSession getById(UUID sessionId){
        return repository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Training session not found"));
    }

    @Transactional
    public TrainingSession update(UUID sessionId, TrainingSessionRequest req){
        TrainingSession existing = getById(sessionId);
        existing.setStartDate(req.getStartDate());
        existing.setEndDate(req.getEndDate());
        existing.setLocation(req.getLocation());
        return repository.save(existing);
    }

    public void delete(UUID sessionId){
        repository.deleteById(sessionId);
    }
}

