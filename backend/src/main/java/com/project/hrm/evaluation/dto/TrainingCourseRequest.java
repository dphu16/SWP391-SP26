package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.TrainingCourse;
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

