package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees")
@Data
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long employeeId;

    private Long userId;
    private String fullName;
    private Long deptId;
    private Long positionId;
    private Long mentorId;
    private Long sourceApplicationId;
    private LocalDate dateOfJoining;
    private String status;
    private Integer currentPerformanceStreak;
    private LocalDate lastSalaryIncreaseDate;
    private LocalDateTime createdAt;
}
