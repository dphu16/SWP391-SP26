package com.project.hrm.module.payroll.entity;



import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.enums.InquiryStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "salary_inquiries", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SalaryInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id")
    private Payslip payslip;

    private String subject;

    private String message;

    @Enumerated(EnumType.STRING)
    private InquiryStatus status;

    @Column(name = "hr_response")
    private String hrResponse;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
