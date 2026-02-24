package com.project.hrm.module.corehr.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeRequestCreateDTO {

    @Pattern(regexp = "^\\d{9,12}$", message = "Citizen ID must be 9 to 12 digits")
    private String citizenId;

    @Pattern(regexp = "^\\d{10}(-\\d{3})?$", message = "Tax code must follow Vietnamese format (10 digits, optionally followed by -XXX)")
    private String taxCode;

}
