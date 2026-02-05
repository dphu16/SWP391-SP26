package com.project.hrm.recruitment.entity;

import com.project.hrm.recruitment.enums.EmployeeStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @Column(name = "employee_id", nullable = false)
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private EmployeeStatus status;

    /**
     * Liên kết ngược:
     * Employee được tạo ra từ Application nào (sau khi HIRED)
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_application_id")
    private Application sourceApplication;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
