package com.project.hrm.module.payroll.compensation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @Column(name = "payslip_id")
    private UUID payslipId;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "type")
    private String type;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

}
