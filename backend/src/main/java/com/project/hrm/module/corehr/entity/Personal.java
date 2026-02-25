package com.project.hrm.module.corehr.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.hrm.module.corehr.enums.Gender;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "personal_info")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Personal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", referencedColumnName = "employee_id", nullable = false)
    private Employee employee;

    @Column(name= "avatar_url")
    private String avatar;

    @Column(name = "citizen_id", unique = true)
    private String citizenId;


    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "tax_code", unique = true)
    private String taxCode;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String address;
    private String phone;

}
