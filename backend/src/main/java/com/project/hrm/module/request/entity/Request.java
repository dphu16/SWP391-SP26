package com.project.hrm.module.request.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Request {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "request_id")
    private UUID requestId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    // Loại yêu cầu: "LEAVE" (Nghỉ), "OT" (Làm thêm), "SHIFT_CHANGE" (Đổi ca)
    @Column(name = "request_type", nullable = false)
    private String requestType;

    @Column(name = "reason")
    private String reason; // Lý do xin phép

    @Column(name = "start_date")
    private LocalDate startDate; // Ngày bắt đầu nghỉ/OT

    @Column(name = "end_date")
    private LocalDate endDate;   // Ngày kết thúc

    // Trạng thái: "PENDING" (Chờ), "APPROVED" (Duyệt), "REJECTED" (Từ chối)
    @Column(name = "status")
    private String status;

    @Column(name = "manager_comment")
    private String managerComment; // Ghi chú của sếp (nếu từ chối thì ghi lý do vào đây)

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING"; // Mặc định là Chờ duyệt
    }
}