package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.CompetencyProfiles;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CompetencyProfilesRequest {
    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    private String skillName;
    private Integer level;
    private LocalDate lastAssessedDate;

    public CompetencyProfiles toEntity(){
        CompetencyProfiles profile = new CompetencyProfiles();
        profile.setSkillName(this.skillName);
        profile.setLevel(this.level);
        profile.setLastAssessedDate(this.lastAssessedDate);
        return profile;
    }
}

