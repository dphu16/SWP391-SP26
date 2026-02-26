package com.project.hrm.module.attendance.entity;


import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "leave_balances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalance {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "balance_id")
    private UUID balanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "annual_leave_total")
    private BigDecimal annualLeaveTotal;

    @Column(name = "annual_leave_used")
    private BigDecimal annualLeaveUsed;

    @Column(name = "sick_leave_used")
    private BigDecimal sickLeaveUsed;
}
