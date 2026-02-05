package com.project.hrm.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
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

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private WorkSchedule workSchedule;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "check_in")
    private LocalTime checkIn;

    @Column(name = "check_out")
    private LocalTime checkOut;

    @Column(name = "ot_hours")
    private Double otHours;

    @Column(name = "working_hours")
    private Double workingHours;

    @Column(length = 20)
    private String status;

}