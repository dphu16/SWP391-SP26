package com.project.hrm.module.attendance.controller;

import com.project.hrm.module.attendance.dto.*;
import com.project.hrm.module.attendance.service.WorkScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/v1/attendance/work-schedules")
public class WorkScheduleController {

    @Autowired
    private WorkScheduleService service;

    // ============================================================================
    // KHU VỰC A: DÀNH CHO NHÂN VIÊN (EMPLOYEE PORTAL)
    // ============================================================================

    // 1. Lấy lịch cá nhân của 1 nhân viên (Dùng cho màn hình View Schedule của FE)
    @PreAuthorize("isAuthenticated()") // Ai đã đăng nhập cũng có thể xem lịch CỦA CHÍNH MÌNH
    @GetMapping("/my-schedule")
    public ResponseEntity<List<WorkScheduleResponse>> getMySchedule(
            @RequestParam(name = "employeeId") UUID employeeId,
            @RequestParam(name = "month", required = false) Integer month,
            @RequestParam(name = "year", required = false) Integer year) {
        return ResponseEntity.ok(service.getMySchedules(employeeId, month, year));
    }

    // ============================================================================
    // KHU VỰC B: DÀNH CHO QUẢN LÝ (MANAGER PORTAL - THAO TÁC VỚI LỊCH)
    // ============================================================================

    // 2. Lấy TẤT CẢ lịch của toàn công ty
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @GetMapping
    public ResponseEntity<List<WorkScheduleResponse>> getAllSchedules() {
        return ResponseEntity.ok(service.getAllSchedules());
    }

    // 3. Tạo 1 lịch mới (Thủ công từng ngày)
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @PostMapping
    public ResponseEntity<WorkScheduleResponse> createSchedule(@RequestBody WorkScheduleRequest request) {
        return ResponseEntity.ok(service.createSchedule(request));
    }

    // 4. Tạo lịch hàng loạt (Từ ngày A đến ngày B)
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @PostMapping("/bulk")
    public ResponseEntity<List<WorkScheduleResponse>> createBulkSchedules(@RequestBody BulkScheduleRequest request) {
        return ResponseEntity.ok(service.createBulkSchedules(
                request.getEmployeeId(), request.getStartDate(), request.getEndDate(), request.getShiftId()));
    }

    // 7. Xóa lịch của 1 ngày
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable(value = "scheduleId") UUID scheduleId) {
        service.deleteSchedule(scheduleId);
        return ResponseEntity.noContent().build();
    }

    // 5. Cập nhật lịch làm việc
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @PutMapping("/{scheduleId}")
    public ResponseEntity<WorkScheduleResponse> updateSchedule(
            @PathVariable(value = "scheduleId") UUID scheduleId,
            @RequestParam(name = "newShiftId") UUID newShiftId) {
        return ResponseEntity.ok(service.updateSchedule(scheduleId, newShiftId));
    }

    // 8. Xóa toàn bộ lịch của 1 nhân viên trong 1 tháng
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @DeleteMapping("/bulk-delete")
    public ResponseEntity<Void> deleteSchedulesByMonth(
            @RequestParam(name = "employeeId") UUID employeeId,
            @RequestParam(name = "month") int month,
            @RequestParam(name = "year") int year) {
        service.deleteSchedulesByMonth(employeeId, month, year);
        return ResponseEntity.noContent().build();
    }

    // ============================================================================
    // KHU VỰC C: QUẢN LÝ CA LÀM VIỆC (SHIFT SETTINGS)
    // ============================================================================

    // 9. Lấy danh sách các loại Ca làm (Sáng, Chiều, Tối...)
    @PreAuthorize("isAuthenticated()") // Nên cho mọi người lấy danh sách ca để có thể View
    @GetMapping("/shifts")
    public ResponseEntity<List<ShiftResponse>> getAllShifts() {
        return ResponseEntity.ok(service.getAllShifts());
    }

    // 10. Tạo một loại Ca làm mới
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @PostMapping("/shifts")
    public ResponseEntity<ShiftResponse> createShift(@RequestBody ShiftRequest request) {
        return ResponseEntity.ok(service.createShift(request));
    }

    // 11. Xóa một loại Ca làm
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @DeleteMapping("/shifts/{shiftId}")
    public ResponseEntity<Void> deleteShift(@PathVariable(value = "shiftId") UUID shiftId) {
        service.deleteShift(shiftId);
        return ResponseEntity.noContent().build();
    }

    // ============================================================================
    // KHU VỰC D: API PHỤ TRỢ (HELPER CHO FRONTEND)
    // ============================================================================

    // 12. Lấy danh sách Nhân viên (Để FE xổ xuống trong ô Dropdown chọn người)
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    @GetMapping("/employees")
    public ResponseEntity<Page<AttendanceEmployeeResponse>> getEmplocdyeesForScheduling(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "search", required = false) String search) {
        return ResponseEntity.ok(service.getEmployeesForScheduling(search, page, size));
    }
}