package com.project.hrm.module.attendance.service;

import com.project.hrm.module.attendance.dto.AttendanceRequest;
import com.project.hrm.module.attendance.entity.AttendanceLog;
import com.project.hrm.module.attendance.entity.WorkSchedule;
import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.attendance.repository.WorkScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceLogService {

    private final AttendanceLogRepository logRepo;
    private final WorkScheduleRepository workScheduleRepo;

    // --- 1. CHECK-IN / CHECK-OUT ---
    public AttendanceLog checkInOrOut(AttendanceRequest request) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Kiểm tra log hôm nay
        Optional<AttendanceLog> existingLog = logRepo.findByEmployeeIdAndDate(request.getEmployeeId(), today);

        if ("IN".equalsIgnoreCase(request.getType())) {
            // === LOGIC CHECK IN ===
            if (existingLog.isPresent()) {
                throw new RuntimeException("Lỗi: Bạn đã Check-in ngày hôm nay rồi!");
            }

            AttendanceLog newLog = new AttendanceLog();
            newLog.setEmployeeId(request.getEmployeeId());
            newLog.setDate(today);
            newLog.setCheckIn(now);
            newLog.setStatus("MISSING_PUNCH"); // Trạng thái chờ Check-out
            newLog.setWorkingHours(BigDecimal.ZERO);
            newLog.setOtHours(BigDecimal.ZERO);

            // Tự động tìm Lịch làm việc hôm nay để link vào (Nếu có)
            List<WorkSchedule> schedules = workScheduleRepo.findByEmployeeId(request.getEmployeeId());
            // Lọc ra lịch trùng ngày hôm nay
            WorkSchedule todaySchedule = schedules.stream()
                    .filter(s -> s.getDate().equals(today))
                    .findFirst()
                    .orElse(null);

            newLog.setWorkSchedule(todaySchedule); // Gán quan hệ

            return logRepo.save(newLog);

        } else if ("OUT".equalsIgnoreCase(request.getType())) {
            // === LOGIC CHECK OUT ===
            AttendanceLog log = existingLog.orElseThrow(() -> new RuntimeException("Lỗi: Chưa Check-in nên không thể Check-out!"));

            log.setCheckOut(now);
            log.setStatus("VALID"); // Tạm định nghĩa là hợp lệ

            // Tính toán giờ làm việc (BigDecimal)
            calculateWorkingHours(log);

            return logRepo.save(log);
        }
        return null;
    }

    // --- 2. MANAGER EDIT (SỬA CÔNG) ---
    public AttendanceLog updateLog(UUID logId, AttendanceRequest req) {
        AttendanceLog log = logRepo.findById(logId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi chấm công!"));

        if (req.getCheckInTime() != null) log.setCheckIn(req.getCheckInTime());
        if (req.getCheckOutTime() != null) log.setCheckOut(req.getCheckOutTime());
        if (req.getStatus() != null) log.setStatus(req.getStatus());

        // Tính lại giờ nếu có đủ thông tin
        calculateWorkingHours(log);

        return logRepo.save(log);
    }

    // --- 3. CÁC HÀM GET ---
    public List<AttendanceLog> getMyHistory(UUID empId) {
        return logRepo.findByEmployeeIdOrderByDateDesc(empId);
    }

    public List<AttendanceLog> getAllLogs() {
        return logRepo.findAllByOrderByDateDesc();
    }

    // --- HÀM PHỤ: TÍNH GIỜ LÀM ---
    private void calculateWorkingHours(AttendanceLog log) {
        if (log.getCheckIn() != null && log.getCheckOut() != null) {
            long minutes = Duration.between(log.getCheckIn(), log.getCheckOut()).toMinutes();

            // Công thức: phút / 60 = giờ (Lấy 2 số thập phân)
            BigDecimal hours = BigDecimal.valueOf(minutes)
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

            log.setWorkingHours(hours);
            // Tạm thời OT = 0 (Logic tính OT phức tạp hơn, để sau)
            log.setOtHours(BigDecimal.ZERO);
        }
    }
}