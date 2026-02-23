package com.project.hrm.evaluation.entity;
import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;


import java.util.UUID;
@Entity
@Table(name = "performance_streaks")
@Data
public class PerformanceStreaks {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "streak_id")
    private UUID streakId;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private Integer currentStreak;
    private Integer bestStreak;

    @Column(name = "last_cycle_id")
    private UUID lastCycleId;
}
