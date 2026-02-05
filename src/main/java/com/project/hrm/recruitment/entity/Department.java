package com.project.hrm.recruitment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "departments")
public class Department {

    @Id
    @Column(name = "dept_id", nullable = false)
    private UUID id;

    @Column(name = "dept_name", nullable = false, length = 100)
    private String name;

    /**
     * Trưởng phòng – người duyệt tuyển
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
