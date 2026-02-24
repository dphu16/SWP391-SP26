package com.project.hrm.module.corehr.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PositionOptionDTO {

    private UUID id;

    private String title;

    private UUID deptId;

    private String deptName;

    private BigDecimal baseSalaryMin;

    private BigDecimal baseSalaryMax;
}
