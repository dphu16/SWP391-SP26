package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.entity.TrainingSession;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class TrainingSessionRequest {
    @NotNull(message = "courseId is required")
    private UUID courseId;

    private LocalDate startDate;
    private LocalDate endDate;
    private String location;

    public TrainingSession toEntity(){
        TrainingSession session = new TrainingSession();
        session.setStartDate(this.startDate);
        session.setEndDate(this.endDate);
        session.setLocation(this.location);
        return session;
    }
}

