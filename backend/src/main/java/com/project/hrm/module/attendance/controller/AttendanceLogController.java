package com.project.hrm.module.attendance.controller;

import com.project.hrm.module.attendance.dto.AttendanceRequest;
import com.project.hrm.module.attendance.dto.AttendanceSummaryDTO;
import com.project.hrm.module.attendance.entity.AttendanceLog;
import com.project.hrm.module.attendance.service.AttendanceLogService;
import com.project.hrm.module.attendance.dto.DepartmentDTO;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceLogController {

    private final AttendanceLogService service;

    // 1. Check-in / Check-out (Employee)
    @PostMapping("/check-in")
    public ResponseEntity<AttendanceLog> checkInOrOut(@RequestBody AttendanceRequest req) {
        return ResponseEntity.ok(service.checkInOrOut(req));
    }

    // 2. Xem lịch sử cá nhân (Employee)
    @GetMapping("/logs/my-history")
    public ResponseEntity<List<AttendanceLog>> getMyHistory(@RequestParam UUID employeeId) {
        return ResponseEntity.ok(service.getMyHistory(employeeId));
    }

    // 3. Xem tất cả chấm công (Manager)
    @GetMapping("/logs")
    public ResponseEntity<List<AttendanceLog>> getAllLogs() {
        return ResponseEntity.ok(service.getAllLogs());
    }

    // 4. Sửa công (Manager)
    @PutMapping("/logs/{id}")
    public ResponseEntity<AttendanceLog> updateLog(@PathVariable UUID id, @RequestBody AttendanceRequest req) {
        return ResponseEntity.ok(service.updateLog(id, req));
    }

    // Đặt trong class Controller của bạn
    @GetMapping("/summary")
    public ResponseEntity<List<AttendanceSummaryDTO>> getSummaryReport(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID employeeId) {

        List<AttendanceSummaryDTO> result = service.getAttendanceSummaryReport(month, year, departmentId, employeeId);
        return ResponseEntity.ok(result);
    }
    private final DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        List<DepartmentDTO> result = departmentRepository.findAll().stream()
                .map(dept -> {
                    DepartmentDTO dto = new DepartmentDTO();
                    dto.setDeptId(dept.getDeptId());
                    dto.setDeptName(dept.getDeptName());
                    return dto;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}