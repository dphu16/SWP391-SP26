package com.project.hrm.module.attendance.controller;

import com.project.hrm.module.attendance.dto.AttendanceEmployeeResponse;
import com.project.hrm.module.attendance.dto.BulkScheduleRequest;
import com.project.hrm.module.attendance.dto.ShiftRequest;
import com.project.hrm.module.attendance.dto.WorkScheduleRequest;
import com.project.hrm.module.attendance.dto.WorkScheduleResponse;
import com.project.hrm.module.attendance.dto.ShiftResponse;
import com.project.hrm.module.attendance.service.WorkScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/v1/attendance/work-schedules")
public class WorkScheduleController {

    @Autowired
    private WorkScheduleService service;

    // =========================================================
    // 1. LẤY TẤT CẢ LỊCH (DÀNH CHO MANAGER)
    // =========================================================
    @GetMapping
    public ResponseEntity<List<WorkScheduleResponse>> getAllSchedules() {
        return ResponseEntity.ok(service.getAllSchedules());
    }

    // =========================================================
    // 2. LẤY LỊCH CÁ NHÂN (DÀNH CHO EMPLOYEE)
    // =========================================================
    @GetMapping("/my-schedule")
    public ResponseEntity<List<WorkScheduleResponse>> getMySchedule(
            // FIX: Added explicit name= to all @RequestParam so Spring can bind
            // them without needing the -parameters compiler flag.
            @RequestParam(name = "employeeId") UUID employeeId,
            @RequestParam(name = "month", required = false) Integer month,
            @RequestParam(name = "year", required = false) Integer year) {
        return ResponseEntity.ok(service.getMySchedules(employeeId, month, year));
    }

    // =========================================================
    // 3. TẠO 1 LỊCH MỚI (THỦ CÔNG)
    // =========================================================
    @PostMapping
    public ResponseEntity<WorkScheduleResponse> createSchedule(@RequestBody WorkScheduleRequest request) {
        return ResponseEntity.ok(service.createSchedule(request));
    }

    // =========================================================
    // 4. TẠO LỊCH HÀNG LOẠT (BULK INSERT)
    // =========================================================
    @PostMapping("/bulk")
    public ResponseEntity<List<WorkScheduleResponse>> createBulkSchedules(@RequestBody BulkScheduleRequest request) {
        List<WorkScheduleResponse> result = service.createBulkSchedules(
                request.getEmployeeId(),
                request.getStartDate(),
                request.getEndDate(),
                request.getShiftId());
        return ResponseEntity.ok(result);
    }

    // =========================================================
    // 5. SỬA LỊCH (ĐỔI CA LÀM VIỆC)
    // =========================================================
    @PutMapping("/{scheduleId}")
    public ResponseEntity<WorkScheduleResponse> updateSchedule(
            // FIX: Added explicit value= to @PathVariable.
            @PathVariable(value = "scheduleId") UUID scheduleId,
            // FIX: Added explicit name= to @RequestParam.
            @RequestParam(name = "newShiftId") UUID newShiftId) {
        return ResponseEntity.ok(service.updateSchedule(scheduleId, newShiftId));
    }

    // =========================================================
    // 6. COPY LỊCH TỪ THÁNG TRƯỚC
    // =========================================================
    @PostMapping("/clone")
    public ResponseEntity<List<WorkScheduleResponse>> cloneSchedule(
            // FIX: Added explicit name= to all @RequestParam.
            @RequestParam(name = "employeeId") UUID employeeId,
            @RequestParam(name = "targetMonth") int targetMonth,
            @RequestParam(name = "targetYear") int targetYear) {
        return ResponseEntity.ok(service.copyFromPreviousMonth(employeeId, targetMonth, targetYear));
    }

    // =========================================================
    // 7. LẤY DANH SÁCH NHÂN VIÊN (ĐỂ ĐỔ VÀO DROPDOWN FRONTEND)
    // =========================================================
    @GetMapping("/employees")
    public ResponseEntity<Page<AttendanceEmployeeResponse>> getEmployeesForScheduling(
            // FIX: Added explicit name= to all @RequestParam.
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "search", required = false) String search) {
        return ResponseEntity.ok(service.getEmployeesForScheduling(search, page, size));
    }

    // =========================================================
    // 8. LẤY TẤT CẢ CA LÀM (ĐỂ ĐỔ VÀO UI)
    // =========================================================
    @GetMapping("/shifts")
    public ResponseEntity<List<ShiftResponse>> getAllShifts() {
        return ResponseEntity.ok(service.getAllShifts());
    }

    // =========================================================
    // 9. TẠO CA LÀM MỚI
    // =========================================================
    @PostMapping("/shifts")
    public ResponseEntity<ShiftResponse> createShift(@RequestBody ShiftRequest request) {
        return ResponseEntity.ok(service.createShift(request));
    }

    // =========================================================
    // 10. XÓA CA LÀM
    // =========================================================
    @DeleteMapping("/shifts/{shiftId}")
    public ResponseEntity<Void> deleteShift(
            // FIX: Added explicit value= to @PathVariable.
            @PathVariable(value = "shiftId") UUID shiftId) {
        service.deleteShift(shiftId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // 11. XÓA TẤT CẢ LỊCH TRONG 1 THÁNG CỦA NHÂN VIÊN
    // =========================================================
    @DeleteMapping("/bulk-delete")
    public ResponseEntity<Void> deleteSchedulesByMonth(
            // FIX: Added explicit name= to all @RequestParam.
            @RequestParam(name = "employeeId") UUID employeeId,
            @RequestParam(name = "month") int month,
            @RequestParam(name = "year") int year) {
        service.deleteSchedulesByMonth(employeeId, month, year);
        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // 12. XÓA LỊCH LÀM (1 ngày cụ thể)
    // =========================================================
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(
            // FIX: Added explicit value= to @PathVariable.
            @PathVariable(value = "scheduleId") UUID scheduleId) {
        service.deleteSchedule(scheduleId);
        return ResponseEntity.noContent().build();
    }
}