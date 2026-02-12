package com.project.hrm.payroll.compensation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "payslip_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayslipDetail {

    @Id
    @GeneratedValue
    @Column(name = "detail_id")
    private UUID detailId;

    @Column(name = "payslip_id", nullable = false)
    private UUID payslipId;

    @Column(name = "item_name", length = 100)
    private String itemName;

    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 20)
    private String type; // INCOME / DEDUCTION
}
