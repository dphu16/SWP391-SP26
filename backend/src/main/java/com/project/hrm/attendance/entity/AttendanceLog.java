package com.project.hrm.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "log_id")
    private UUID logId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    // Quan hệ ManyToOne: Một log thuộc về một lịch làm việc
    @ManyToOne(fetch = FetchType.EAGER) // Eager để khi query log lấy luôn được thông tin ca
    @JoinColumn(name = "schedule_id")
    private WorkSchedule workSchedule;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "check_in")
    private LocalTime checkIn;

    @Column(name = "check_out")
    private LocalTime checkOut;

    @Column(name = "status", length = 20)
    private String status;

    // Map với kiểu NUMERIC(4, 2) trong DB
    @Column(name = "working_hours", precision = 4, scale = 2)
    private BigDecimal workingHours;

    @Column(name = "ot_hours", precision = 4, scale = 2)
    private BigDecimal otHours;
}