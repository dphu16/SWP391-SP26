package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class KpiAcknowledgementRequest {
    @NotNull(message = "goalId is required")
    private UUID goalId;

    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    private Boolean isConfirmed = false;

    public KpiAcknowledgement toEntity(){
        KpiAcknowledgement ack = new KpiAcknowledgement();
        ack.setStatus(this.isConfirmed);
        return ack;
    }
}

