package com.project.hrm.module.corehr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponseDTO {
    private Long id;
    private LocalDateTime timestamp;
    private String actor;
    private String actionType;
    private String description;
    private String fieldChanged;
    private String oldValue;
    private String newValue;
}
