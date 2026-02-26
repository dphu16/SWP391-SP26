package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.entity.TrainingCourse;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TrainingCourseRequest {
    @NotBlank(message = "courseName is required")
    private String courseName;

    private String description;

    public TrainingCourse toEntity(){
        TrainingCourse course = new TrainingCourse();
        course.setCourseName(this.courseName);
        course.setDescription(this.description);
        return course;
    }
}

