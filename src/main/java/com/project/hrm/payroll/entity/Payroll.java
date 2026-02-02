package com.project.hrm.payroll.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "payroll")
@Data
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer month;
    private Integer year;
    private Double totalSalary;
    private String status;
}
