package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.entity.TrainingParticipant;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class TrainingParticipantRequest {
    @NotNull(message = "courseId is required")
    private UUID courseId;

    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    private String status;
    private LocalDate deadline;
    private String reason;
    private UUID reviewId;
    private String certificateUrl;
    private OffsetDateTime certificateSubmittedAt;
    private OffsetDateTime hrConfirmedAt;
    private UUID confirmedById;

    public TrainingParticipant toEntity(){
        TrainingParticipant participant = new TrainingParticipant();
        if(this.status != null) participant.setStatus(this.status);
        participant.setDeadline(this.deadline);
        participant.setReason(this.reason);
        participant.setCertificateUrl(this.certificateUrl);
        participant.setCertificateSubmittedAt(this.certificateSubmittedAt);
        participant.setHrConfirmedAt(this.hrConfirmedAt);
        return participant;
    }
}

