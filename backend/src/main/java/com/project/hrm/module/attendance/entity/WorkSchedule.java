package com.project.hrm.module.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "work_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "schedule_id")
    private UUID scheduleId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    // Nối sang bảng Shifts: Một lịch chỉ có 1 ca
    @ManyToOne
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @Column(name = "date", nullable = false)
    private LocalDate date;
}