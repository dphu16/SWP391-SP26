package com.project.hrm.attendance.service;

import com.project.hrm.attendance.dto.AttendanceEmployeeResponse;
import com.project.hrm.attendance.dto.ShiftResponse;
import com.project.hrm.attendance.dto.WorkScheduleRequest;
import com.project.hrm.attendance.dto.WorkScheduleResponse;
import com.project.hrm.attendance.entity.Shift;
import com.project.hrm.attendance.entity.WorkSchedule;
import com.project.hrm.attendance.repository.ShiftRepository;
import com.project.hrm.attendance.repository.WorkScheduleRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
// SỬA LỖI 1: Phải import org.springframework.data.domain.Page (Bạn đang import nhầm của Hibernate)
import org.springframework.data.domain.Page;
// SỬA LỖI 2: Phải import org.springframework.data.domain.Pageable (Bạn đang import nhầm java.awt.print.Pageable của in ấn)
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

    // SỬA LỖI 3: Khai báo @Autowired cho Repo của đồng nghiệp thì mới dùng được
    @Autowired
    private EmployeeRepository employeeRepository;

    // ===================================================================
    // 1. Hàm tạo lịch mới
    // ===================================================================
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

    // ===================================================================
    // 2. Hàm lấy tất cả
    // ===================================================================
    public List<WorkScheduleResponse> getAllSchedules() {
        List<WorkSchedule> entities = workScheduleRepository.findAll();
        List<WorkScheduleResponse> dtos = new ArrayList<>();
        for (WorkSchedule entity : entities) {
            dtos.add(mapToResponse(entity));
        }
        return dtos;
    }

    // ===================================================================
    // 3. Hàm phụ mapToResponse
    // ===================================================================
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

    // ===================================================================
    // 4. Xem lịch cá nhân
    // ===================================================================
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

        List<WorkSchedule> entities = workScheduleRepository.findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId,
                startDate, endDate);
        List<WorkScheduleResponse> dtos = new ArrayList<>();
        for (WorkSchedule entity : entities) {
            dtos.add(mapToResponse(entity));
        }
        return dtos;
    }

    // ===================================================================
    // 5. XẾP LỊCH HÀNG LOẠT (BULK INSERT)
    // ===================================================================
    @Transactional
    public List<WorkScheduleResponse> createBulkSchedules(UUID employeeId, LocalDate startDate, LocalDate endDate,
            UUID shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Ca làm việc không tồn tại!"));

        List<WorkSchedule> newSchedules = new ArrayList<>();
        LocalDate currentDate = startDate;

        List<WorkSchedule> existingSchedules = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, endDate);

        Set<LocalDate> existingDates = existingSchedules.stream()
                .map(WorkSchedule::getDate)
                .collect(Collectors.toSet());

        while (!currentDate.isAfter(endDate)) {
            if (currentDate.getDayOfWeek() != DayOfWeek.SUNDAY && !existingDates.contains(currentDate)) {
                WorkSchedule ws = new WorkSchedule();
                ws.setEmployeeId(employeeId);
                ws.setDate(currentDate);
                ws.setShift(shift);
                newSchedules.add(ws);
            }
            currentDate = currentDate.plusDays(1);
        }

        List<WorkSchedule> savedSchedules = workScheduleRepository.saveAll(newSchedules);
        List<WorkScheduleResponse> dtos = new ArrayList<>();
        for (WorkSchedule entity : savedSchedules) {
            dtos.add(mapToResponse(entity));
        }
        return dtos;
    }

    // ===================================================================
    // 6. SỬA LỊCH
    // ===================================================================
    public WorkScheduleResponse updateSchedule(UUID scheduleId, UUID newShiftId) {
        WorkSchedule ws = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch làm việc này!"));

        Shift newShift = shiftRepository.findById(newShiftId)
                .orElseThrow(() -> new RuntimeException("Ca làm việc mới không tồn tại!"));

        ws.setShift(newShift);
        WorkSchedule updatedWs = workScheduleRepository.save(ws);
        return mapToResponse(updatedWs);
    }

    // ===================================================================
    // 7. COPY LỊCH TỪ THÁNG TRƯỚC
    // ===================================================================
    @Transactional
    public List<WorkScheduleResponse> copyFromPreviousMonth(UUID employeeId, int targetMonth, int targetYear) {
        LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
        LocalDate sourceDate = targetDate.minusMonths(1);

        LocalDate startSource = sourceDate.withDayOfMonth(1);
        LocalDate endSource = sourceDate.withDayOfMonth(sourceDate.lengthOfMonth());

        List<WorkSchedule> sourceSchedules = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startSource, endSource);

        if (sourceSchedules.isEmpty()) {
            throw new RuntimeException("Tháng trước không có dữ liệu để copy!");
        }

        LocalDate startTarget = targetDate.withDayOfMonth(1);
        LocalDate endTarget = targetDate.withDayOfMonth(targetDate.lengthOfMonth());
        List<WorkSchedule> existingTarget = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startTarget, endTarget);
        Set<LocalDate> existingDates = existingTarget.stream()
                .map(WorkSchedule::getDate)
                .collect(Collectors.toSet());

        List<WorkSchedule> newSchedules = new ArrayList<>();

        for (WorkSchedule oldWs : sourceSchedules) {
            LocalDate newDate = oldWs.getDate().plusMonths(1);
            if (newDate.getDayOfWeek() != DayOfWeek.SUNDAY && !existingDates.contains(newDate)) {
                WorkSchedule newWs = new WorkSchedule();
                newWs.setEmployeeId(employeeId);
                newWs.setDate(newDate);
                newWs.setShift(oldWs.getShift());
                newSchedules.add(newWs);
            }
        }

        List<WorkSchedule> savedSchedules = workScheduleRepository.saveAll(newSchedules);
        List<WorkScheduleResponse> dtos = new ArrayList<>();
        for (WorkSchedule entity : savedSchedules) {
            dtos.add(mapToResponse(entity));
        }
        return dtos;
    }

    // =========================================================
    // 8. API LẤY DANH SÁCH NHÂN VIÊN ĐỂ TẠO LỊCH
    // =========================================================
    public Page<AttendanceEmployeeResponse> getEmployeesForScheduling(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Employee> employeePage;

        if (search != null && !search.trim().isEmpty()) {
            // SỬA LỖI 3: Gọi qua biến instance `employeeRepository` thay vì gọi static
            // Class
            employeePage = employeeRepository.searchEmployeesByKeyword(search.trim(), pageable);
        } else {
            employeePage = employeeRepository.findAllWithDetails(pageable);
        }

        return employeePage.map(emp -> {
            AttendanceEmployeeResponse dto = new AttendanceEmployeeResponse();
            dto.setId(emp.getEmployeeId());
            dto.setFullName(emp.getFullName() != null ? emp.getFullName() : "Chưa cập nhật tên");
            dto.setEmployeeCode("EMP-" + emp.getEmployeeId().toString().substring(0, 8).toUpperCase());

            if (emp.getDepartment() != null) {
                dto.setDeptName(emp.getDepartment().getDeptName());
            } else {
                dto.setDeptName("Chưa xếp phòng");
            }

            return dto;
        });
    }
}