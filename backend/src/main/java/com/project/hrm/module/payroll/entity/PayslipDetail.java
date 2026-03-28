package com.project.hrm.module.payroll.entity;


import com.project.hrm.module.payroll.enums.PayslipDetailType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
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
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "detail_id")
    private UUID detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", nullable = false)
    private Payslip payslip;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "type", nullable = false)
    private PayslipDetailType type;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
