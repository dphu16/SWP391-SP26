package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.enums.ChangeRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeRequestResponseDTO {

    private UUID id;

    private ChangeRequestStatus status;

    private OffsetDateTime createdAt;
}
