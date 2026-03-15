package com.project.hrm.module.request.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "leave_balances")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "balance_id")
    private UUID balanceId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "year", nullable = false)
    private int year;

    @Column(name = "annual_leave_total", nullable = false)
    private int annualLeaveTotal;

    @Column(name = "annual_leave_used", nullable = false)
    private int annualLeaveUsed;

    @Column(name = "sick_leave_used", nullable = false)
    private int sickLeaveUsed;

    /**
     * Remaining annual leave = total - used
     */
    public int getRemainingAnnualLeave() {
        return annualLeaveTotal - annualLeaveUsed;
    }
}
