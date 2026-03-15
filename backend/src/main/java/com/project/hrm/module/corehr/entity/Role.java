package com.project.hrm.module.corehr.entity;

import com.project.hrm.module.corehr.enums.EmployeeRole;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    private EmployeeRole name;

    @Column(length = 255)
    private String description;
}
