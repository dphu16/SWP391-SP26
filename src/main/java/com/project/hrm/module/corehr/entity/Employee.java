package com.project.hrm.module.corehr.entity;

import com.project.hrm.module.corehr.enums.CoreHREnum;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "employees")
@Data
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "employee_id")
    private UUID employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id")
    private Employee mentor;

    // 5. Link tới Application (Nếu chưa code class Application thì có thể để tạm ID hoặc comment lại)
    // @OneToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "source_application_id")
    // private Application sourceApplication;
//    @Column(name = "source_application_id")
//    private UUID sourceApplicationId; // Tạm thời map ID nếu chưa có Entity Application

    @Column(name = "date_of_joining")
    private LocalDate dateOfJoining;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "emp_status_enum")
    private CoreHREnum.EmpStatus status;

    @Column(name = "current_performance_streak")
    private Integer currentPerformanceStreak;

    @Column(name = "last_salary_increase_date")
    private LocalDate lastSalaryIncreaseDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
