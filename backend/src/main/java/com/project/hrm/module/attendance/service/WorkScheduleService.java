package com.project.hrm.module.attendance.service;

import com.project.hrm.module.attendance.dto.*;
import com.project.hrm.module.attendance.entity.Shift;
import com.project.hrm.module.attendance.entity.WorkSchedule;
import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.attendance.repository.ShiftRepository;
import com.project.hrm.module.attendance.repository.WorkScheduleRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkScheduleService {

    private final WorkScheduleRepository workScheduleRepository;
    private final ShiftRepository shiftRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceLogRepository attendanceLogRepository;

    // ============================================================================
    // KHU VỰC A: DÀNH CHO NHÂN VIÊN (EMPLOYEE PORTAL)
    // ============================================================================

    public List<WorkScheduleResponse> getMySchedules(UUID employeeId, Integer month, Integer year) {
        LocalDate startDate;
        LocalDate endDate;

        if (month == null || year == null) {
            LocalDate now = LocalDate.now();
            startDate = now.withDayOfMonth(1);
            endDate = now.withDayOfMonth(now.lengthOfMonth());
        } else {
            startDate = LocalDate.of(year, month, 1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        }

        return workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ============================================================================
    // KHU VỰC B: DÀNH CHO QUẢN LÝ (MANAGER PORTAL - THAO TÁC VỚI LỊCH)
    // ============================================================================

    public List<WorkScheduleResponse> getAllSchedules() {
        return workScheduleRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public WorkScheduleResponse createSchedule(WorkScheduleRequest request) {
        if (request.getDate() == null) throw new RuntimeException("Schedule date is required.");
        if (request.getDate().isBefore(LocalDate.now())) throw new RuntimeException("Cannot create a schedule for a past date: " + request.getDate());
        if (request.getEmployeeId() == null) throw new RuntimeException("Employee ID is required.");

        WorkSchedule existing = workScheduleRepository.findByEmployeeIdAndDate(request.getEmployeeId(), request.getDate());
        if (existing != null) {
            throw new RuntimeException("A schedule already exists for this employee on " + request.getDate() + ". Use the update endpoint to change the shift.");
        }

        WorkSchedule entity = new WorkSchedule();
        entity.setDate(request.getDate());
        entity.setEmployeeId(request.getEmployeeId());

        if (request.getShiftId() != null) {
            Shift shift = shiftRepository.findById(request.getShiftId())
                    .orElseThrow(() -> new RuntimeException("Shift not found: " + request.getShiftId()));
            entity.setShift(shift);
        }

        return mapToResponse(workScheduleRepository.save(entity));
    }

    @Transactional
    public List<WorkScheduleResponse> createBulkSchedules(UUID employeeId, LocalDate startDate, LocalDate endDate, UUID shiftId) {
        LocalDate today = LocalDate.now();

        if (startDate == null || endDate == null) throw new RuntimeException("Start date and end date are required.");
        if (startDate.isBefore(today)) throw new RuntimeException("Start date cannot be in the past: " + startDate);
        if (endDate.isBefore(startDate)) throw new RuntimeException("End date (" + endDate + ") must not be before start date (" + startDate + ").");

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Shift not found: " + shiftId));

        Set<LocalDate> existingDates = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, endDate)
                .stream()
                .map(WorkSchedule::getDate)
                .collect(Collectors.toSet());

        List<WorkSchedule> newSchedules = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            if (current.getDayOfWeek() != DayOfWeek.SUNDAY && !existingDates.contains(current)) {
                WorkSchedule ws = new WorkSchedule();
                ws.setEmployeeId(employeeId);
                ws.setDate(current);
                ws.setShift(shift);
                newSchedules.add(ws);
            }
            current = current.plusDays(1);
        }

        return workScheduleRepository.saveAll(newSchedules).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


    @Transactional
    public void deleteSchedule(UUID scheduleId) {
        if (!workScheduleRepository.existsById(scheduleId)) {
            throw new RuntimeException("Work schedule not found: " + scheduleId);
        }
        attendanceLogRepository.deleteAll(attendanceLogRepository.findByWorkSchedule_ScheduleId(scheduleId));
        workScheduleRepository.deleteById(scheduleId);
    }

    @Transactional
    public void deleteSchedulesByMonth(UUID employeeId, int month, int year) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<WorkSchedule> schedulesToDelete = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, endDate);

        if (schedulesToDelete.isEmpty()) {
            throw new RuntimeException("No schedules found for this employee in " + startDate.getMonth() + " " + year + ".");
        }

        for (WorkSchedule ws : schedulesToDelete) {
            attendanceLogRepository.deleteAll(attendanceLogRepository.findByWorkSchedule_ScheduleId(ws.getScheduleId()));
        }

        workScheduleRepository.deleteAll(schedulesToDelete);
    }

    // ============================================================================
    // KHU VỰC C: QUẢN LÝ CA LÀM VIỆC (SHIFT SETTINGS)
    // ============================================================================

    public List<ShiftResponse> getAllShifts() {
        return shiftRepository.findAll().stream()
                .map(this::mapToShiftResponse) // GỌN GÀNG!
                .collect(Collectors.toList());
    }

    public ShiftResponse createShift(ShiftRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) throw new RuntimeException("Shift name is required.");
        if (request.getStartTime() == null || request.getStartTime().trim().isEmpty()) throw new RuntimeException("Start time is required.");
        if (request.getEndTime() == null || request.getEndTime().trim().isEmpty()) throw new RuntimeException("End time is required.");

        boolean nameTaken = shiftRepository.findAll().stream()
                .anyMatch(s -> s.getShiftName() != null && s.getShiftName().equalsIgnoreCase(request.getName().trim()));
        if (nameTaken) throw new RuntimeException("A shift with the name '" + request.getName() + "' already exists.");

        Shift shift = new Shift();
        shift.setShiftName(request.getName().trim());
        shift.setStartTime(java.time.LocalTime.parse(request.getStartTime()));
        shift.setEndTime(java.time.LocalTime.parse(request.getEndTime()));

        return mapToShiftResponse(shiftRepository.save(shift)); // GỌN GÀNG!
    }

    public void deleteShift(UUID shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Shift not found: " + shiftId));

        boolean inUse = workScheduleRepository.findAll().stream()
                .anyMatch(ws -> ws.getShift() != null && ws.getShift().getShiftId().equals(shiftId));
        if (inUse) {
            throw new RuntimeException("Cannot delete shift '" + shift.getShiftName() + "' because it is currently assigned to one or more schedules.");
        }

        shiftRepository.deleteById(shiftId);
    }

    // ============================================================================
    // KHU VỰC D: API PHỤ TRỢ (HELPER CHO FRONTEND)
    // ============================================================================

    public Page<AttendanceEmployeeResponse> getEmployeesForScheduling(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Employee> employeePage;

        if (search != null && !search.trim().isEmpty()) {
            employeePage = employeeRepository.searchEmployeesByKeyword(search.trim(), pageable);
        } else {
            employeePage = employeeRepository.findAllWithDetails(pageable);
        }

        return employeePage.map(this::mapToEmployeeResponse); // GỌN GÀNG!
    }

    // ============================================================================
    // KHU VỰC E: XƯỞNG ĐÓNG GÓI DTO (MAPPERS)
    // ============================================================================

    private WorkScheduleResponse mapToResponse(WorkSchedule entity) {
        WorkScheduleResponse dto = new WorkScheduleResponse();
        dto.setId(entity.getScheduleId());
        dto.setDate(entity.getDate());

        if (entity.getShift() != null) {
            dto.setShift(mapToShiftResponse(entity.getShift())); // Tái sử dụng Helper
        }
        return dto;
    }

    private ShiftResponse mapToShiftResponse(Shift s) {
        ShiftResponse dto = new ShiftResponse();
        dto.setId(s.getShiftId());
        dto.setName(s.getShiftName());
        dto.setStartTime(s.getStartTime());
        dto.setEndTime(s.getEndTime());
        return dto;
    }

    private AttendanceEmployeeResponse mapToEmployeeResponse(Employee emp) {
        AttendanceEmployeeResponse dto = new AttendanceEmployeeResponse();
        dto.setId(emp.getEmployeeId());
        dto.setFullName(emp.getFullName() != null ? emp.getFullName() : "Name not updated");
        dto.setEmployeeCode(emp.getEmployeeCode() != null
                ? emp.getEmployeeCode()
                : "EMP-" + emp.getEmployeeId().toString().substring(0, 8).toUpperCase());
        dto.setDeptName(emp.getDepartment() != null ? emp.getDepartment().getDeptName() : "No department assigned");
        return dto;
    }
}