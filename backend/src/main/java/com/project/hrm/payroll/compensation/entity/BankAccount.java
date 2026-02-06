package com.project.hrm.payroll.compensation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "bank_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount {

    @Id
    @GeneratedValue
    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @Column(name = "holder_name", length = 100)
    private String holderName;

    @Column(name = "is_primary")
    private Boolean isPrimary = true;
}
