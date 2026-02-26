package com.project.hrm.module.attendance.service;

import com.project.hrm.module.attendance.dto.AttendanceRequest;
import com.project.hrm.module.attendance.dto.AttendanceSummaryDTO;
import com.project.hrm.module.attendance.entity.AttendanceLog;
import com.project.hrm.module.attendance.entity.Shift;
import com.project.hrm.module.attendance.entity.WorkSchedule;
import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.attendance.repository.WorkScheduleRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceLogService {

    private final AttendanceLogRepository logRepo;
    private final WorkScheduleRepository workScheduleRepo;
    private final EmployeeRepository employeeRepo;

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

            // [FIX 3]: TỐI ƯU TRUY VẤN - Chọc DB 1 phát lấy đúng lịch hôm nay, không lôi mớ data rác lên RAM
            WorkSchedule todaySchedule = workScheduleRepo.findByEmployeeIdAndDate(request.getEmployeeId(), today);

            AttendanceLog newLog = new AttendanceLog();
            newLog.setEmployeeId(request.getEmployeeId());
            newLog.setDate(today);
            newLog.setCheckIn(now);
            newLog.setStatus("MISSING_PUNCH"); // Trạng thái chờ Check-out
            newLog.setWorkingHours(BigDecimal.ZERO);
            newLog.setOtHours(BigDecimal.ZERO);
            newLog.setWorkSchedule(todaySchedule); // Gán quan hệ ca làm

            return logRepo.save(newLog);

        } else if ("OUT".equalsIgnoreCase(request.getType())) {
            // === LOGIC CHECK OUT ===
            AttendanceLog log = existingLog.orElseThrow(() -> new RuntimeException("Lỗi: Chưa Check-in nên không thể Check-out!"));

            log.setCheckOut(now);

            // [FIX 1 & 2]: Gọi hàm xịn để đánh giá Trạng thái và Trừ giờ nghỉ trưa
            evaluateAttendance(log);

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

        // Nếu Manager chủ động set status thì dùng, không thì tự động tính lại
        if (req.getStatus() != null) {
            log.setStatus(req.getStatus());
        } else {
            evaluateAttendance(log);
        }

        return logRepo.save(log);
    }

    // --- 3. CÁC HÀM GET ---
    public List<AttendanceLog> getMyHistory(UUID empId) {
        return logRepo.findByEmployeeIdOrderByDateDesc(empId);
    }

    public List<AttendanceLog> getAllLogs() {
        return logRepo.findAllByOrderByDateDesc();
    }

    // --- HÀM NGHIỆP VỤ: ĐÁNH GIÁ TRẠNG THÁI & TÍNH GIỜ LÀM ---
    private void evaluateAttendance(AttendanceLog log) {
        if (log.getCheckIn() == null || log.getCheckOut() == null) return;

        // Nếu hôm nay làm "chui" (không có ca được xếp sẵn) -> Tính công bình thường, không trừ trưa
        if (log.getWorkSchedule() == null || log.getWorkSchedule().getShift() == null) {
            long minutes = Duration.between(log.getCheckIn(), log.getCheckOut()).toMinutes();
            log.setWorkingHours(BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
            log.setStatus("VALID");
            return;
        }

        Shift shift = log.getWorkSchedule().getShift();
        LocalTime checkIn = log.getCheckIn();
        LocalTime checkOut = log.getCheckOut();

        // [FIX 1]: Phán xét Đi muộn / Về sớm (Có cho phép du di 5 phút tắc đường)
        if (checkIn.isAfter(shift.getStartTime().plusMinutes(5))) {
            log.setStatus("LATE");
        } else if (checkOut.isBefore(shift.getEndTime())) {
            log.setStatus("EARLY_LEAVE");
        } else {
            log.setStatus("VALID");
        }

        // [FIX 2]: Tính giờ làm và TRỪ GIỜ NGHỈ TRƯA (Cứu công ty khỏi lỗ tiền)
        long totalMinutes = Duration.between(checkIn, checkOut).toMinutes();

        if (shift.getBreakStart() != null && shift.getBreakEnd() != null) {
            // Chỉ trừ giờ trưa nếu Check-in trước giờ ăn VÀ Check-out sau giờ ăn
            if (checkIn.isBefore(shift.getBreakStart()) && checkOut.isAfter(shift.getBreakEnd())) {
                long breakMinutes = Duration.between(shift.getBreakStart(), shift.getBreakEnd()).toMinutes();
                totalMinutes -= breakMinutes;
            }
        }

        // Chống số âm nếu lỡ tay sửa bậy
        if (totalMinutes < 0) totalMinutes = 0;

        // Chuyển phút thành giờ (Ví dụ: 480 phút -> 8.00 giờ)
        BigDecimal hours = BigDecimal.valueOf(totalMinutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        log.setWorkingHours(hours);
        log.setOtHours(BigDecimal.ZERO); // Mặc định OT = 0, team lương tự tính sau
    }

    public List<AttendanceSummaryDTO> getAttendanceSummaryReport(Integer month, Integer year, UUID deptId, UUID empId) {
        // 1. Lấy tháng hiện tại nếu không truyền vào
        int targetMonth = (month != null) ? month : LocalDate.now().getMonthValue();
        int targetYear = (year != null) ? year : LocalDate.now().getYear();

        // 2. Lấy danh sách nhân viên & Lọc theo yêu cầu
        List<Employee> allEmployees = employeeRepo.findAll();
        List<Employee> filteredEmployees = allEmployees.stream()
                .filter(emp -> {
                    boolean matchDept = (deptId == null) ||
                            (emp.getDepartment() != null && emp.getDepartment().getDeptId().equals(deptId));
                    boolean matchEmp = (empId == null) || emp.getEmployeeId().equals(empId);
                    return matchDept && matchEmp;
                })
                .collect(Collectors.toList());

        // 3. Tính toán cho từng người
        List<AttendanceSummaryDTO> reportList = new ArrayList<>();

        for (Employee emp : filteredEmployees) {
            List<AttendanceLog> logs = logRepo.findLogsByMonthAndYear(emp.getEmployeeId(), targetMonth, targetYear);

            BigDecimal totalHours = BigDecimal.ZERO;
            int lateDays = 0, earlyLeaveDays = 0, missingPunchDays = 0;

            for (AttendanceLog log : logs) {
                if (log.getWorkingHours() != null) totalHours = totalHours.add(log.getWorkingHours());
                if ("LATE".equals(log.getStatus())) lateDays++;
                if ("EARLY_LEAVE".equals(log.getStatus())) earlyLeaveDays++;
                if ("MISSING_PUNCH".equals(log.getStatus())) missingPunchDays++;
            }

            String deptName = (emp.getDepartment() != null) ? emp.getDepartment().getDeptName() : "Chưa có phòng ban";

            reportList.add(AttendanceSummaryDTO.builder()
                    .employeeId(emp.getEmployeeId())
                    .employeeCode(emp.getEmployeeCode())
                    .fullName(emp.getFullName())
                    .departmentName(deptName)
                    .month(targetMonth)
                    .year(targetYear)
                    .totalWorkingHours(totalHours)
                    .totalLateDays(lateDays)
                    .totalEarlyLeaveDays(earlyLeaveDays)
                    .totalMissingPunchDays(missingPunchDays)
                    .build());
        }

        return reportList;
    }
}