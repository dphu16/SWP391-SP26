package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.TrainingCourseRequest;
import com.project.hrm.module.evaluation.entity.TrainingCourse;
import com.project.hrm.module.evaluation.repository.TrainingCourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TrainingCourseService {
    private final TrainingCourseRepository repository;

    public TrainingCourseService(TrainingCourseRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TrainingCourse create(TrainingCourseRequest req){
        TrainingCourse course = new TrainingCourse();
        course.setCourseName(req.getCourseName());
        course.setDescription(req.getDescription());
        return repository.save(course);
    }

    public List<TrainingCourse> getAll(){
        return repository.findAll();
    }

    public TrainingCourse getById(UUID courseId){
        return repository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Training course not found"));
    }

    @Transactional
    public TrainingCourse update(UUID courseId, TrainingCourseRequest req){
        TrainingCourse existing = getById(courseId);
        existing.setCourseName(req.getCourseName());
        existing.setDescription(req.getDescription());
        return repository.save(existing);
    }

    public void delete(UUID courseId){
        repository.deleteById(courseId);
    }
}

