package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.TrainingCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TrainingCourseRepository extends JpaRepository<TrainingCourse, UUID> {
}

