package com.project.hrm.evaluation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamStatsResponse {
    private long totalMembers;
    private long submittedMembers;
    private Double averageScore;
}
