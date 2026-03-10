package com.project.hrm.module.payroll.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "finance_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinanceAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "account_name", nullable = false)
    private String accountName;

    @Column(name = "account_number", unique = true, nullable = false)
    private String accountNumber;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "current_balance")
    private BigDecimal currentBalance = BigDecimal.ZERO;

    private String status = "ACTIVE";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
