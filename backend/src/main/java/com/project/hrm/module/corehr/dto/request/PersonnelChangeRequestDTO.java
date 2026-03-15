package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.PersonnelChangeType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PersonnelChangeRequestDTO {
    private UUID employeeId;
    private PersonnelChangeType changeType;
    private String reason;

    // For DEPARTMENT_TRANSFER
    private UUID newDepartmentId;
    private UUID newPositionId;


    // For SALARY_CHANGE
    private BigDecimal newSalary;

    // For DISCIPLINE / REWARD
    private String description;
}
