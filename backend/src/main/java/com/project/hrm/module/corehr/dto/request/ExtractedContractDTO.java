package com.project.hrm.module.corehr.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExtractedContractDTO {
    private String fullName;
    private String phone;
    private String email;
    private String gender;
    private String address;
    private String citizenId;
    private String taxCode;
    private LocalDate dateOfBirth;
    private BigDecimal baseSalary;
    private String contractNumber;
    private String contractType;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate dateOfJoining;
    private String departmentName;
    private String positionName;
}
