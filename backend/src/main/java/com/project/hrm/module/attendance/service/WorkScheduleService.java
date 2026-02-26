package com.project.hrm.module.attendance.service;

import com.project.hrm.module.attendance.dto.AttendanceEmployeeResponse;
import com.project.hrm.module.attendance.dto.ShiftResponse;
import com.project.hrm.module.attendance.dto.WorkScheduleRequest;
import com.project.hrm.module.attendance.dto.WorkScheduleResponse;
import com.project.hrm.module.attendance.entity.Shift;
import com.project.hrm.module.attendance.entity.WorkSchedule;
import com.project.hrm.module.attendance.repository.ShiftRepository;
import com.project.hrm.module.attendance.repository.WorkScheduleRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WorkScheduleService {

    @Autowired
    private WorkScheduleRepository workScheduleRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    // =========================================================
    // 1. API LẤY DANH SÁCH NHÂN VIÊN ĐỂ TẠO LỊCH (FIXED NAME)
    // =========================================================
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

            if (emp.getPersonal() != null && emp.getFullName() != null) {
                dto.setFullName(emp.getFullName());
            } else {
                dto.setFullName("Chưa cập nhật tên");
            }

            if (emp.getEmployeeCode() != null) {
                dto.setEmployeeCode(emp.getEmployeeCode());
            } else {
                dto.setEmployeeCode("EMP-" + emp.getEmployeeId().toString().substring(0, 8).toUpperCase());
            }

            if (emp.getDepartment() != null) {
                dto.setDeptName(emp.getDepartment().getDeptName());
            } else {
                dto.setDeptName("Chưa xếp phòng");
            }

            return dto;
        });
    }

    public WorkScheduleResponse createSchedule(WorkScheduleRequest request) {
        WorkSchedule entity = new WorkSchedule();
        entity.setDate(request.getDate());
        entity.setEmployeeId(request.getEmployeeId());

        if (request.getShiftId() != null) {
            Shift shift = shiftRepository.findById(request.getShiftId()).orElse(null);
            entity.setShift(shift);
        }

        WorkSchedule savedEntity = workScheduleRepository.save(entity);
        return mapToResponse(savedEntity);
    }

    public List<WorkScheduleResponse> getAllSchedules() {
        return workScheduleRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

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

        return workScheduleRepository.findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<WorkScheduleResponse> createBulkSchedules(UUID employeeId, LocalDate startDate, LocalDate endDate,
                                                          UUID shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Ca làm việc không tồn tại!"));

        List<WorkSchedule> existingSchedules = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, endDate);

        Set<LocalDate> existingDates = existingSchedules.stream()
                .map(WorkSchedule::getDate)
                .collect(Collectors.toSet());

        List<WorkSchedule> newSchedules = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            // Không xếp lịch vào Chủ Nhật và những ngày đã có lịch
            if (currentDate.getDayOfWeek() != DayOfWeek.SUNDAY && !existingDates.contains(currentDate)) {
                WorkSchedule ws = new WorkSchedule();
                ws.setEmployeeId(employeeId);
                ws.setDate(currentDate);
                ws.setShift(shift);
                newSchedules.add(ws);
            }
            currentDate = currentDate.plusDays(1);
        }

        return workScheduleRepository.saveAll(newSchedules).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public WorkScheduleResponse updateSchedule(UUID scheduleId, UUID newShiftId) {
        WorkSchedule ws = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch làm việc này!"));

        Shift newShift = shiftRepository.findById(newShiftId)
                .orElseThrow(() -> new RuntimeException("Ca làm việc mới không tồn tại!"));

        ws.setShift(newShift);
        WorkSchedule updatedWs = workScheduleRepository.save(ws);
        return mapToResponse(updatedWs);
    }

    @Transactional
    public List<WorkScheduleResponse> copyFromPreviousMonth(UUID employeeId, int targetMonth, int targetYear) {
        LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
        LocalDate sourceDate = targetDate.minusMonths(1);

        List<WorkSchedule> sourceSchedules = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId,
                        sourceDate.withDayOfMonth(1),
                        sourceDate.withDayOfMonth(sourceDate.lengthOfMonth()));

        if (sourceSchedules.isEmpty()) {
            throw new RuntimeException("Tháng trước không có dữ liệu để copy!");
        }

        List<WorkSchedule> existingTarget = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId,
                        targetDate.withDayOfMonth(1),
                        targetDate.withDayOfMonth(targetDate.lengthOfMonth()));

        Set<LocalDate> existingDates = existingTarget.stream()
                .map(WorkSchedule::getDate)
                .collect(Collectors.toSet());

        java.util.Map<DayOfWeek, Shift> shiftByDayOfWeek = new java.util.HashMap<>();
        for (WorkSchedule ws : sourceSchedules) {
            shiftByDayOfWeek.putIfAbsent(ws.getDate().getDayOfWeek(), ws.getShift());
        }

        List<WorkSchedule> newSchedules = new ArrayList<>();
        for (int day = 1; day <= targetDate.lengthOfMonth(); day++) {
            LocalDate currentDate = targetDate.withDayOfMonth(day);
            if (currentDate.getDayOfWeek() == DayOfWeek.SUNDAY || existingDates.contains(currentDate))
                continue;

            Shift shift = shiftByDayOfWeek.get(currentDate.getDayOfWeek());
            if (shift == null)
                shift = sourceSchedules.get(0).getShift();

            WorkSchedule newWs = new WorkSchedule();
            newWs.setEmployeeId(employeeId);
            newWs.setDate(currentDate);
            newWs.setShift(shift);
            newSchedules.add(newWs);
        }

        return workScheduleRepository.saveAll(newSchedules).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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