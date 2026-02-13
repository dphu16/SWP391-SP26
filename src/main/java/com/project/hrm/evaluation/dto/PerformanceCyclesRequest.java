package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.PerformanceCycles;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PerformanceCyclesRequest {
    @NotBlank(message = "cycleName is required")
    private String cycleName;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    @NotNull(message = "endDate is required")
    private LocalDate endDate;

    private String status = "DRAFT";

    public PerformanceCycles toEntity(){
        PerformanceCycles p = new PerformanceCycles();
        p.setNameCycle(this.cycleName);
        p.setDateStart(this.startDate);
        p.setDateEnd(this.endDate);
        p.setStatus(this.status);
        return p;
    }
}

