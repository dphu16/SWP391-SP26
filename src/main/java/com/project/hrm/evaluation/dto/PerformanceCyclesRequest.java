package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.PerformanceCycles;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PerformanceCyclesRequest {
    @NotBlank(message = "nameCycle is required")
    private String nameCycle;

    @NotNull(message = "dateStart is required")
    private LocalDate dateStart;

    @NotNull(message = "dateEnd is required")
    private LocalDate dateEnd;

    private String status = "DRAFT";

    public PerformanceCycles toEntity(){
        PerformanceCycles p = new PerformanceCycles();
        p.setNameCycle(this.nameCycle);
        p.setDateStart(this.dateStart);
        p.setDateEnd(this.dateEnd);
        p.setStatus(this.status);
        return p;
    }
}

