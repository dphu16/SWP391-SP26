package com.project.hrm.attendance.controller;

import com.project.hrm.attendance.dto.BulkScheduleRequest;
import com.project.hrm.attendance.dto.WorkScheduleRequest;
import com.project.hrm.attendance.dto.WorkScheduleResponse;
import com.project.hrm.attendance.service.WorkScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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
    // GET http://localhost:8080/api/v1/attendance/work-schedules/my-schedule?employeeId=...
    @GetMapping("/work-schedules/my-schedule")
    public ResponseEntity<List<WorkScheduleResponse>> getMySchedule(
            @RequestParam UUID employeeId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        return ResponseEntity.ok(workScheduleService.getMySchedules(employeeId, month, year));
    }

    // =========================================================
    // 1. TẠO LỊCH HÀNG LOẠT (BULK INSERT)
    // =========================================================
    @PostMapping("/bulk")
    public ResponseEntity<List<WorkScheduleResponse>> createBulkSchedules(@RequestBody BulkScheduleRequest request) {
        List<WorkScheduleResponse> result = workScheduleService.createBulkSchedules(
                request.getEmployeeId(),
                request.getStartDate(),
                request.getEndDate(),
                request.getShiftId()
        );
        return ResponseEntity.ok(result);
    }

    // =========================================================
    // 2. SỬA LỊCH (ĐỔI CA CHO 1 NGÀY CỤ THỂ)
    // =========================================================
    @PutMapping("/{scheduleId}")
    public ResponseEntity<WorkScheduleResponse> updateSchedule(
            @PathVariable UUID scheduleId,
            @RequestParam UUID newShiftId) {
        WorkScheduleResponse result = workScheduleService.updateSchedule(scheduleId, newShiftId);
        return ResponseEntity.ok(result);
    }

    // =========================================================
    // 3. COPY LỊCH TỪ THÁNG TRƯỚC
    // =========================================================
    @PostMapping("/clone")
    public ResponseEntity<List<WorkScheduleResponse>> cloneSchedule(
            @RequestParam UUID employeeId,
            @RequestParam int targetMonth,
            @RequestParam int targetYear) {
        List<WorkScheduleResponse> result =workScheduleService.copyFromPreviousMonth(employeeId, targetMonth, targetYear);
        return ResponseEntity.ok(result);
    }
}