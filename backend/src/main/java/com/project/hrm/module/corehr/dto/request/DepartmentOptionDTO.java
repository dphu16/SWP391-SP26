package com.project.hrm.module.corehr.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DepartmentOptionDTO {

    private UUID id;
    private String name;
    private UUID managerId;
    private String managerName;
    private UUID mentorId;
    private String mentorName;
}
