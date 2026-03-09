package com.project.hrm.module.corehr.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmergencyContactDTO {

    @NotBlank(message = "Contact name is required")
    private String contactName;

    @NotBlank(message = "Relationship is required")
    private String relationship;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String address;
}
