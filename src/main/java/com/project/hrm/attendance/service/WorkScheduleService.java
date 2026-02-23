package com.project.hrm.attendance.service;

import com.project.hrm.attendance.dto.ShiftResponse;
import com.project.hrm.attendance.dto.WorkScheduleRequest;
import com.project.hrm.attendance.dto.WorkScheduleResponse;
import com.project.hrm.attendance.entity.Shift;
import com.project.hrm.attendance.entity.WorkSchedule;
import com.project.hrm.attendance.repository.ShiftRepository;
import com.project.hrm.attendance.repository.WorkScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class WorkScheduleService {

    @Autowired
    private WorkScheduleRepository workScheduleRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    // 1. Hàm tạo lịch mới (ĐỂ TEST POST)
    public WorkScheduleResponse createSchedule(WorkScheduleRequest request) {
        WorkSchedule entity = new WorkSchedule();

        // Gán dữ liệu từ Request vào Entity
        entity.setDate(request.getDate());
        entity.setEmployeeId(request.getEmployeeId());

        // Tìm Shift trong DB, nếu không thấy thì để null (Test mà)
        if (request.getShiftId() != null) {
            Shift shift = shiftRepository.findById(request.getShiftId()).orElse(null);
            entity.setShift(shift);
        }

        // Lưu xuống DB
        WorkSchedule savedEntity = workScheduleRepository.save(entity);

        // Chuyển ngược lại sang Response để trả về cho API
        return mapToResponse(savedEntity);
    }

    // 2. Hàm lấy tất cả (CODE CŨ CỦA BẠN - Đã tách phần map ra hàm riêng cho gọn)
    public List<WorkScheduleResponse> getAllSchedules() {
        List<WorkSchedule> entities = workScheduleRepository.findAll();
        List<WorkScheduleResponse> dtos = new ArrayList<>();

        for (WorkSchedule entity : entities) {
            dtos.add(mapToResponse(entity));
        }
        return dtos;
    }

    // Hàm phụ: Chuyển Entity -> DTO (Dùng chung cho cả 2 hàm trên đỡ phải viết lại)
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

    // THÊM: Cho nhân viên chỉ xem lịch của mình
    public List<WorkScheduleResponse> getMySchedules(UUID employeeId, Integer month, Integer year) {
        LocalDate startDate;
        LocalDate endDate;

        // Nếu không truyền tháng/năm thì lấy tháng hiện tại
        if (month == null || year == null) {
            LocalDate now = LocalDate.now();
            startDate = now.withDayOfMonth(1);
            endDate = now.withDayOfMonth(now.lengthOfMonth());
        } else {
            // Lấy từ ngày mùng 1 đến ngày cuối cùng của tháng được chọn
            startDate = LocalDate.of(year, month, 1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        }

        List<WorkSchedule> entities = workScheduleRepository.findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, endDate);

        List<WorkScheduleResponse> dtos = new ArrayList<>();
        for (WorkSchedule entity : entities) {
            dtos.add(mapToResponse(entity));
        }
        return dtos;
    }
}