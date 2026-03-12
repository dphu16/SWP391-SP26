package com.project.hrm.module.corehr.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelOffboardingDTO {

    @NotBlank(message = "Cancel reason is required")
    private String cancelReason;
}
