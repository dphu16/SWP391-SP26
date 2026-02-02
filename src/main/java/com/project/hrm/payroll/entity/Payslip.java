package com.project.hrm.payroll.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "payslip")
@Data
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long employeeId;
    private Double basicSalary;
    private Double tax;
    private Double netSalary;
}
