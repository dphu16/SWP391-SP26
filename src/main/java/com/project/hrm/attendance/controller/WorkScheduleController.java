package com.project.hrm.attendance.controller;

import com.project.hrm.attendance.dto.WorkScheduleRequest;
import com.project.hrm.attendance.dto.WorkScheduleResponse;
import com.project.hrm.attendance.service.WorkScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance")
public class WorkScheduleController {

    @Autowired
    private WorkScheduleService workScheduleService;

    // 1. API Tạo lịch làm việc (POST)
    // URL: http://localhost:8080/api/v1/attendance/work-schedules
    @PostMapping("/work-schedules")
    public ResponseEntity<WorkScheduleResponse> createSchedule(@RequestBody WorkScheduleRequest request) {
        // Gọi hàm createSchedule mà mình vừa thêm vào Service
        WorkScheduleResponse response = workScheduleService.createSchedule(request);
        return ResponseEntity.ok(response);
    }

    // 2. API Lấy danh sách lịch (GET)
    // URL: http://localhost:8080/api/v1/attendance/work-schedules
    @GetMapping("/work-schedules")
    public ResponseEntity<List<WorkScheduleResponse>> getAllSchedules() {
        // Gọi hàm getAllSchedules gốc của bạn
        return ResponseEntity.ok(workScheduleService.getAllSchedules());
    }
}