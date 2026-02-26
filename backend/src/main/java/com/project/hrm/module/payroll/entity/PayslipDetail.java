package com.project.hrm.module.payroll.entity;


import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payslip_details", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayslipDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "detail_id")
    private UUID detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id")
    private Payslip payslip;

    @Column(name = "item_name")
    private String itemName;

    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    // Type: 1 = Income, 2 = Deduction
    @Column(nullable = false)
    private Short type;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
