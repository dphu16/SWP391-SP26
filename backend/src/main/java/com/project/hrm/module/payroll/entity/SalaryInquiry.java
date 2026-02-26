package com.project.hrm.payroll.compensation.entity;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.payroll.common.enums.InquiryStatus;
import jakarta.persistence.*;
import lombok.*;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "salary_inquiries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryInquiry {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "payslip_id")
    private Payslip payslip;

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private InquiryStatus status;

    @Column(name = "hr_response", columnDefinition = "TEXT")
    private String hrResponse;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
