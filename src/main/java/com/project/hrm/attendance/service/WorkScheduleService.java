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

import java.time.DayOfWeek;
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
    // ===================================================================
    // 1. XẾP LỊCH HÀNG LOẠT (BULK INSERT)
    // ===================================================================
    @Transactional
    public List<WorkScheduleResponse> createBulkSchedules(UUID employeeId, LocalDate startDate, LocalDate endDate, UUID shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Ca làm việc không tồn tại!"));

        List<WorkSchedule> newSchedules = new ArrayList<>();
        LocalDate currentDate = startDate;

        // Lấy danh sách lịch đã có trong khoảng thời gian này để chặn tạo trùng
        List<WorkSchedule> existingSchedules = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, endDate);

        // Chuyển danh sách lịch cũ thành một Tập hợp (Set) các ngày để dễ check
        Set<LocalDate> existingDates = existingSchedules.stream()
                .map(WorkSchedule::getDate)
                .collect(Collectors.toSet());

        // Chạy vòng lặp từ ngày bắt đầu đến ngày kết thúc
        while (!currentDate.isAfter(endDate)) {
            // Điều kiện: KHÔNG phải Chủ Nhật VÀ ngày đó chưa có lịch
            if (currentDate.getDayOfWeek() != DayOfWeek.SUNDAY && !existingDates.contains(currentDate)) {
                WorkSchedule ws = new WorkSchedule();
                ws.setEmployeeId(employeeId);
                ws.setDate(currentDate);
                ws.setShift(shift);
                newSchedules.add(ws);
            }
            currentDate = currentDate.plusDays(1); // Tăng lên 1 ngày
        }

        // Lưu 1 cục vào DB (Nhanh hơn lưu từng cái)
        List<WorkSchedule> savedSchedules = workScheduleRepository.saveAll(newSchedules);

        List<WorkScheduleResponse> dtos = new ArrayList<>();
        for (WorkSchedule entity : savedSchedules) {
            dtos.add(mapToResponse(entity));
        }
        return dtos;
    }

    // ===================================================================
    // 2. SỬA LỊCH (EDIT SCHEDULE) - VD: Đổi từ ca Sáng sang ca Chiều
    // ===================================================================
    public WorkScheduleResponse updateSchedule(UUID scheduleId, UUID newShiftId) {
        WorkSchedule ws = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch làm việc này!"));

        Shift newShift = shiftRepository.findById(newShiftId)
                .orElseThrow(() -> new RuntimeException("Ca làm việc mới không tồn tại!"));

        ws.setShift(newShift); // Cập nhật ca mới

        WorkSchedule updatedWs = workScheduleRepository.save(ws);
        return mapToResponse(updatedWs);
    }

    // ===================================================================
    // 3. COPY LỊCH TỪ THÁNG TRƯỚC (CLONE MONTH)
    // ===================================================================
    @Transactional
    public List<WorkScheduleResponse> copyFromPreviousMonth(UUID employeeId, int targetMonth, int targetYear) {
        // 1. Xác định tháng nguồn (Tháng trước)
        LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
        LocalDate sourceDate = targetDate.minusMonths(1); // Lùi lại 1 tháng

        LocalDate startSource = sourceDate.withDayOfMonth(1);
        LocalDate endSource = sourceDate.withDayOfMonth(sourceDate.lengthOfMonth());

        // 2. Lấy toàn bộ lịch của tháng trước
        List<WorkSchedule> sourceSchedules = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startSource, endSource);

        if (sourceSchedules.isEmpty()) {
            throw new RuntimeException("Tháng trước không có dữ liệu để copy!");
        }

        // 3. Lấy lịch tháng này (Target) để chặn lưu đè nếu ngày đó đã có lịch
        LocalDate startTarget = targetDate.withDayOfMonth(1);
        LocalDate endTarget = targetDate.withDayOfMonth(targetDate.lengthOfMonth());
        List<WorkSchedule> existingTarget = workScheduleRepository
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startTarget, endTarget);
        Set<LocalDate> existingDates = existingTarget.stream()
                .map(WorkSchedule::getDate)
                .collect(Collectors.toSet());

        List<WorkSchedule> newSchedules = new ArrayList<>();

        // 4. Bắt đầu tiến hành Copy
        for (WorkSchedule oldWs : sourceSchedules) {
            // Đẩy ngày lên 1 tháng (VD: 15/01 tự biến thành 15/02)
            LocalDate newDate = oldWs.getDate().plusMonths(1);

            // Bỏ qua Chủ Nhật VÀ kiểm tra xem ngày mới đã bị xếp lịch chưa
            if (newDate.getDayOfWeek() != DayOfWeek.SUNDAY && !existingDates.contains(newDate)) {
                WorkSchedule newWs = new WorkSchedule();
                newWs.setEmployeeId(employeeId);
                newWs.setDate(newDate);
                newWs.setShift(oldWs.getShift()); // Bê y nguyên ca làm việc của tháng trước sang
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
}