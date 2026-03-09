package com.project.hrm.module.corehr.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OffboardingRequestDTO {

    @NotNull(message = "Offboarding type is required")
    private String type;

    @NotBlank(message = "Reason is required")
    private String reason;

    private LocalDate expectedLastDay;
}
