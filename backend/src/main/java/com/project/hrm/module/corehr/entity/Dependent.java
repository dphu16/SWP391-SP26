package com.project.hrm.module.corehr.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dependents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dependent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "dependent_id")
    private UUID dependentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "full_name", length = 100)
    private String contactName;

    @Column(length = 50)
    private String relationship;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "address", length = 100)
    private String address;
}
