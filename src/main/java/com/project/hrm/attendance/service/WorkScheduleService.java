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

import java.util.ArrayList;
import java.util.List;

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
}