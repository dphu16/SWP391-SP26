package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.TrainingParticipant;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class TrainingParticipantRequest {
    @NotNull(message = "sessionId is required")
    private UUID sessionId;

    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    private String attendanceStatus;

    public TrainingParticipant toEntity(){
        TrainingParticipant participant = new TrainingParticipant();
        participant.setAttendanceStatus(this.attendanceStatus);
        return participant;
    }
}

