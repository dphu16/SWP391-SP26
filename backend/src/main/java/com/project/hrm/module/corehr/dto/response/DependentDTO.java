package com.project.hrm.module.corehr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO trả về thông tin người phụ thuộc (dependent) của nhân viên.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DependentDTO {
    private UUID id;
    private String fullName;
    private LocalDate dateOfBirth;
    private String relationship;
    private String phone;
    private String address;
    private String status;
}
