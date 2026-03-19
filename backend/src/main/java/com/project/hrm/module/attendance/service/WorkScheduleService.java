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
            // Bỏ qua Chủ Nhật và những ngày đã có lịch
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
    public List<WorkScheduleResponse> copyFromPreviousMonth(UUID employeeId, int targetMonth, int targetYear) {
        LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);

        if (targetDate.isBefore(LocalDate.now().withDayOfMonth(1))) {
            throw new RuntimeException("Cannot copy schedules to a past month: " + targetMonth + "/" + targetYear);
        }

        LocalDate sourceStart = targetDate.minusMonths(1).withDayOfMonth(1);
        LocalDate sourceEnd = sourceStart.withDayOfMonth(sourceStart.lengthOfMonth());

        List<WorkSchedule> sourceSchedules = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, sourceStart, sourceEnd);

        if (sourceSchedules.isEmpty()) {
            throw new RuntimeException("No schedule data found for " + sourceStart.getMonth() + " " + sourceStart.getYear() + " to copy from.");
        }

        Set<LocalDate> existingTargetDates = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, targetDate, targetDate.withDayOfMonth(targetDate.lengthOfMonth()))
                .stream().map(WorkSchedule::getDate).collect(Collectors.toSet());

        Map<DayOfWeek, Shift> shiftByDayOfWeek = new HashMap<>();
        for (WorkSchedule ws : sourceSchedules) {
            shiftByDayOfWeek.putIfAbsent(ws.getDate().getDayOfWeek(), ws.getShift());
        }
        Shift fallbackShift = sourceSchedules.get(0).getShift();

        List<WorkSchedule> newSchedules = new ArrayList<>();
        for (int day = 1; day <= targetDate.lengthOfMonth(); day++) {
            LocalDate current = targetDate.withDayOfMonth(day);
            if (current.getDayOfWeek() == DayOfWeek.SUNDAY || existingTargetDates.contains(current)) continue;

            Shift shift = shiftByDayOfWeek.getOrDefault(current.getDayOfWeek(), fallbackShift);

            WorkSchedule newWs = new WorkSchedule();
            newWs.setEmployeeId(employeeId);
            newWs.setDate(current);
            newWs.setShift(shift);
            newSchedules.add(newWs);
        }

        return workScheduleRepository.saveAll(newSchedules).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public WorkScheduleResponse updateSchedule(UUID scheduleId, UUID newShiftId) {
        WorkSchedule ws = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Work schedule not found: " + scheduleId));

        if (ws.getDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Cannot modify a schedule for a past date: " + ws.getDate());
        }

        Shift newShift = shiftRepository.findById(newShiftId)
                .orElseThrow(() -> new RuntimeException("Shift not found: " + newShiftId));

        ws.setShift(newShift);
        return mapToResponse(workScheduleRepository.save(ws));
    }

    @Transactional
    public void deleteSchedule(UUID scheduleId) {
        if (!workScheduleRepository.existsById(scheduleId)) {
            throw new RuntimeException("Work schedule not found: " + scheduleId);
        }
        // Xóa attendance logs liên quan trước (tránh FK constraint)
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
        return shiftRepository.findAll().stream().map(s -> {
            ShiftResponse dto = new ShiftResponse();
            dto.setId(s.getShiftId());
            dto.setName(s.getShiftName());
            dto.setStartTime(s.getStartTime());
            dto.setEndTime(s.getEndTime());
            return dto;
        }).collect(Collectors.toList());
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

        Shift saved = shiftRepository.save(shift);
        ShiftResponse dto = new ShiftResponse();
        dto.setId(saved.getShiftId());
        dto.setName(saved.getShiftName());
        dto.setStartTime(saved.getStartTime());
        dto.setEndTime(saved.getEndTime());
        return dto;
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

        return employeePage.map(emp -> {
            AttendanceEmployeeResponse dto = new AttendanceEmployeeResponse();
            dto.setId(emp.getEmployeeId());
            dto.setFullName(emp.getFullName() != null ? emp.getFullName() : "Name not updated");
            dto.setEmployeeCode(emp.getEmployeeCode() != null
                    ? emp.getEmployeeCode()
                    : "EMP-" + emp.getEmployeeId().toString().substring(0, 8).toUpperCase());
            dto.setDeptName(emp.getDepartment() != null ? emp.getDepartment().getDeptName() : "No department assigned");
            return dto;
        });
    }

    private WorkScheduleResponse mapToResponse(WorkSchedule entity) {
        WorkScheduleResponse dto = new WorkScheduleResponse();
        dto.setId(entity.getScheduleId());
        dto.setDate(entity.getDate());

        if (entity.getShift() != null) {
            ShiftResponse shiftDto = new ShiftResponse();
            shiftDto.setId(entity.getShift().getShiftId());
            shiftDto.setName(entity.getShift().getShiftName());
            shiftDto.setStartTime(entity.getShift().getStartTime());
            shiftDto.setEndTime(entity.getShift().getEndTime());
            dto.setShift(shiftDto);
        }
        return dto;
    }
}