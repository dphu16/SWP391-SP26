package com.project.hrm.module.corehr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmployeeChangeRequestDTO {

    @NotBlank
    private String phone;
    private String address;
    private String email;
}
