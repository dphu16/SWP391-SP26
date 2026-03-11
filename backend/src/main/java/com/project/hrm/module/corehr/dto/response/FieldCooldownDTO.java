package com.project.hrm.module.corehr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FieldCooldownDTO {
    private String fieldName;
    private LocalDateTime changedAt;
    private LocalDateTime cooldownUntil;
    private boolean locked;
}
