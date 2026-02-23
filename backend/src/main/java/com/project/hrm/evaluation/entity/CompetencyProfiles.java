package com.project.hrm.evaluation.entity;

import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "competency_profiles")
@Data
public class CompetencyProfiles {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "profile_id")
    private UUID profileId;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "skill_name")
    private String skillName;

    private Integer level;

    private String source;

    @Column(name = "last_assessed_date")
    private LocalDate lastAssessedDate;
}
