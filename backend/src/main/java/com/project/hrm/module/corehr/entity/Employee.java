package com.project.hrm.module.corehr.entity;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "employees", indexes = {
                @Index(name = "idx_employees_code", columnList = "employee_code"),
                @Index(name = "idx_employees_dept", columnList = "dept_id"),
                @Index(name = "idx_employees_manager", columnList = "manager_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        @Column(name = "employee_id", updatable = false, nullable = false)
        private UUID employeeId;

        @Column(name = "employee_code", unique = true)
        private String employeeCode;

        @Column(name = "full_name", nullable = false)
        private String fullName;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "dept_id")
        private Department department;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "position_id")
        private Position position;

        @Enumerated(EnumType.STRING)
        @Column(name = "progress_status")
        private ProgressStatus empStatus;

        @Column(name = "date_of_joining")
        private LocalDate dateOfJoining;

        @Enumerated(EnumType.STRING)
        @Column(name = "status")
        private EmployeeStatus status;

        @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
        private User user;

        @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
        private Personal personal;

        @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
        private Contract contract;

        @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
        @Builder.Default
        private List<Dependent> dependents = new ArrayList<>();

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "manager_id")
        @OnDelete(action = OnDeleteAction.SET_NULL)
        private Employee manager;
}