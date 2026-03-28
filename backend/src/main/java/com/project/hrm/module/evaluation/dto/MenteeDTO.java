package com.project.hrm.module.evaluation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenteeDTO {
    private UUID employeeId;
    private String fullName;
    private String positionTitle;
    private String avatarUrl;
}
