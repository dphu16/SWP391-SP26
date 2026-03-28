package com.project.hrm.module.request.service;

import com.project.hrm.module.attendance.entity.AttendanceLog;
import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.attendance.repository.WorkScheduleRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.request.dto.RequestDTO;
import com.project.hrm.module.request.dto.RequestResponseDTO;
import com.project.hrm.module.request.entity.LeaveBalance;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.enums.RequestType;

import com.project.hrm.module.request.repository.LeaveBalanceRepository;
import com.project.hrm.module.request.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RequestService {

    private final RequestRepository requestRepo;
    private final EmployeeRepository employeeRepo;
    private final LeaveBalanceRepository leaveBalanceRepo;
    private final AttendanceLogRepository attendanceLogRepo;
    private final WorkScheduleRepository workScheduleRepo;

    // --- 1. TẠO YÊU CẦU MỚI (EMPLOYEE) ---
    @Transactional
    public Request createRequest(RequestDTO dto) {
        // [MỚI]: Validate ngày quá khứ và kiểm tra lịch làm việc (áp dụng cho LEAVE và OT)
        if (dto.getRequestType() == RequestType.LEAVE || dto.getRequestType() == RequestType.OT) {
            validateDatesAndSchedules(dto.getEmployeeId(), dto.getStartDate(), dto.getEndDate(), dto.getRequestType());
        }

        // Validate leave balance when creating a LEAVE request
        if (dto.getRequestType() == RequestType.LEAVE) {
            validateLeaveBalance(dto.getEmployeeId(), dto.getStartDate(), dto.getEndDate(), dto.getReason());
        }

        Request req = new Request();
        req.setEmployeeId(dto.getEmployeeId());
        req.setRequestType(dto.getRequestType());
        req.setReason(dto.getReason());
        req.setStartDate(dto.getStartDate());
        req.setEndDate(dto.getEndDate());
        Request saved = requestRepo.save(req);

        return saved;
    }

    // --- 2. XEM YÊU CẦU CÁ NHÂN (EMPLOYEE) ---
    @Transactional(readOnly = true)
    public List<Request> getMyRequests(UUID empId) {
        return requestRepo.findByEmployeeIdOrderByCreatedAtDesc(empId);
    }

    // --- 3. XEM TẤT CẢ KÈM TÊN NHÂN VIÊN & PHÒNG BAN (MANAGER) ---
    @Transactional(readOnly = true)
    public List<RequestResponseDTO> getAllRequestsForReview() {
        return requestRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(req -> {
                    Employee emp = employeeRepo.findById(req.getEmployeeId()).orElse(null);

                    return RequestResponseDTO.builder()
                            .requestId(req.getRequestId())
                            .employeeName(emp != null ? emp.getFullName() : "Unknown")
                            .deptName(emp != null && emp.getDepartment() != null
                                    ? emp.getDepartment().getDeptName()
                                    : "N/A")
                            .requestType(req.getRequestType())
                            .status(req.getStatus())
                            .reason(req.getReason())
                            .startDate(req.getStartDate())
                            .endDate(req.getEndDate())
                            .createdAt(req.getCreatedAt())
                            .build();
                }).collect(Collectors.toList());
    }

    // --- 4. DUYỆT YÊU CẦU (MANAGER) ---
    @Transactional
    public Request approveRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Can only approve requests with PENDING status.");
        }

        // Deduct leave balance if this is a LEAVE request
        if (req.getRequestType() == RequestType.LEAVE) {
            deductLeaveBalance(req);
            removeWorkSchedulesOnLeave(req);
        }

        // Record OT hours into AttendanceLog if this is an OT request
        if (req.getRequestType() == RequestType.OT) {
            recordOtHours(req);
        }

        // Other request types (like OTHER) do not need secondary processing currently
        req.setStatus(RequestStatus.APPROVED);
        if (dto != null && dto.getManagerComment() != null) {
            req.setManagerComment(dto.getManagerComment());
        }
        Request saved = requestRepo.save(req);

        return saved;
    }

    // --- 5. TỪ CHỐI YÊU CẦU (MANAGER) ---
    @Transactional
    public Request rejectRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));

        req.setStatus(RequestStatus.REJECTED);
        if (dto != null && dto.getManagerComment() != null) {
            req.setManagerComment(dto.getManagerComment());
        }
        Request saved = requestRepo.save(req);

        return saved;
    }

    // --- 6. CẬP NHẬT YÊU CẦU ---
    @Transactional
    public Request updateRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Can only update requests with PENDING status.");
        }

        // [MỚI]: Kiểm tra lại tính hợp lệ của ngày và lịch làm việc khi Update đơn
        if (dto.getRequestType() == RequestType.LEAVE || dto.getRequestType() == RequestType.OT) {
            validateDatesAndSchedules(req.getEmployeeId(), dto.getStartDate(), dto.getEndDate(), dto.getRequestType());
        }

        // BỔ SUNG: Kiểm tra lại quỹ phép nếu đây là đơn LEAVE hoặc đang chuyển thành LEAVE
        if (dto.getRequestType() == RequestType.LEAVE) {
            validateLeaveBalance(req.getEmployeeId(), dto.getStartDate(), dto.getEndDate(), dto.getReason());
        }

        req.setRequestType(dto.getRequestType());
        req.setReason(dto.getReason());
        req.setStartDate(dto.getStartDate());
        req.setEndDate(dto.getEndDate());

        return requestRepo.save(req);
    }

    // --- 7. XÓA YÊU CẦU ---
    @Transactional
    public void deleteRequest(UUID requestId) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Can only delete requests with PENDING status.");
        }

        requestRepo.delete(req);
    }

    // --- 8. XEM ĐƠN CÁ NHÂN FORMATTED ---
    @Transactional(readOnly = true)
    public List<Request> getMyRequestsFormatted(UUID empId) {
        return requestRepo.findByEmployeeIdOrderByCreatedAtDesc(empId);
    }

    // --- 9. XEM LEAVE BALANCE CỦA NHÂN VIÊN ---
    @Transactional(readOnly = true)
    public Optional<LeaveBalance> getLeaveBalance(UUID employeeId, int year) {
        return leaveBalanceRepo.findByEmployeeIdAndYear(employeeId, year);
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    /**
     * [MỚI BỔ SUNG]
     * Hàm Validate 1: Không được xin lùi về quá khứ
     * Hàm Validate 2: Bắt buộc phải có Lịch làm việc (Work Schedule) vào ngày xin nghỉ/OT
     */
    private void validateDatesAndSchedules(UUID employeeId, LocalDate startDate, LocalDate endDate, RequestType type) {
        if (startDate == null) return;

        LocalDate today = LocalDate.now();
        LocalDate end = (endDate == null || endDate.isBefore(startDate)) ? startDate : endDate;

        // 1. Chặn ngày trong quá khứ
        if (startDate.isBefore(today)) {
            throw new RuntimeException("Cannot create a " + type.name() + " request for past dates. Please select a date from today onwards.");
        }

        // 2. Chặn những ngày không có lịch làm việc (Work Schedule)
        // Lấy danh sách lịch làm việc của nhân viên trong khoảng thời gian request
        List<com.project.hrm.module.attendance.entity.WorkSchedule> schedules = workScheduleRepo
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, startDate, end);

        // Chuyển List lịch thành Set chứa các ngày có lịch để truy vấn cho nhanh
        Set<LocalDate> scheduledDates = schedules.stream()
                .map(com.project.hrm.module.attendance.entity.WorkSchedule::getDate)
                .collect(Collectors.toSet());

        LocalDate current = startDate;
        while (!current.isAfter(end)) {
            boolean isSunday = current.getDayOfWeek() == DayOfWeek.SUNDAY;

            // Bỏ qua Chủ Nhật đối với đơn xin nghỉ (vì vốn dĩ không làm việc nên không cần xét lịch)
            if (type == RequestType.LEAVE && isSunday) {
                current = current.plusDays(1);
                continue;
            }

            // Nếu ngày đang xét KHÔNG nằm trong danh sách các ngày có lịch làm việc -> Ném lỗi
            if (!scheduledDates.contains(current)) {
                throw new RuntimeException("Invalid request: No work schedule found for " + current + ". You can only request " + type.name() + " on scheduled working days.");
            }
            current = current.plusDays(1);
        }
    }

    // Tính số ngày nghỉ khi tạo đơn
    // Không tính chủ nhật
    private int calculateLeaveDays(LocalDate startDate, LocalDate endDate) {
        if (startDate == null)
            return 0;

        LocalDate end = (endDate == null || endDate.isBefore(startDate)) ? startDate : endDate;

        int count = 0;
        LocalDate current = startDate;
        while (!current.isAfter(end)) {
            if (current.getDayOfWeek() != DayOfWeek.SUNDAY) {
                count++;
            }
            current = current.plusDays(1);
        }
        return count;
    }

    /**
     * Check if reason indicates sick leave (format: "[Sick Leave] ...")
     */
    private boolean isSickLeave(String reason) {
        return reason != null && reason.startsWith("[Sick Leave]");
    }

    // Kiểm tra số ngày nghỉ còn lại
    private void validateLeaveBalance(UUID employeeId, LocalDate startDate, LocalDate endDate, String reason) {
        if (startDate == null)
            return;

        int year = startDate.getYear();
        int leaveDays = calculateLeaveDays(startDate, endDate);

        LeaveBalance balance = leaveBalanceRepo.findByEmployeeIdAndYear(employeeId, year)
                .orElse(null);

        if (balance == null) {
            throw new RuntimeException("No leave balance record found for year " + year
                    + ". Please contact HR.");
        }

        if (isSickLeave(reason)) {
            // Sick leave: no hard limit but we track it
            return;
        }

        // Annual leave: check remaining
        int remaining = balance.getRemainingAnnualLeave(); // hàm get từ entity
        if (leaveDays > remaining) {
            throw new RuntimeException("Insufficient annual leave balance. "
                    + "Requesting " + leaveDays + " day(s) but only " + remaining
                    + " day(s) remaining for " + year + ".");
        }
    }

    // Trừ số ngày nghỉ khi tạo đơn
    private void deductLeaveBalance(Request req) {
        if (req.getStartDate() == null)
            return;

        int year = req.getStartDate().getYear();
        int leaveDays = calculateLeaveDays(req.getStartDate(), req.getEndDate());

        LeaveBalance balance = leaveBalanceRepo.findByEmployeeIdAndYear(req.getEmployeeId(), year)
                .orElseThrow(() -> new RuntimeException(
                        "No leave balance record found for employee in year " + year + "."));

        if (isSickLeave(req.getReason())) {
            // Sick leave: just increment used counter
            balance.setSickLeaveUsed(balance.getSickLeaveUsed() + leaveDays);
        } else {
            // Annual leave: validate then deduct
            int remaining = balance.getRemainingAnnualLeave();
            if (leaveDays > remaining) {
                throw new RuntimeException("Cannot approve: insufficient annual leave balance. "
                        + "Requesting " + leaveDays + " day(s) but only " + remaining
                        + " day(s) remaining for " + year + ".");
            }
            balance.setAnnualLeaveUsed(balance.getAnnualLeaveUsed() + leaveDays);
        }

        leaveBalanceRepo.save(balance);
    }

    /**
     * Record OT hours into AttendanceLog when an OT request is approved.
     * Parses the OT time range from reason (format: "HH:mm - HH:mm | reason text")
     * and writes otHours to the attendance log for that date.
     */
    private void recordOtHours(Request req) {
        if (req.getStartDate() == null || req.getReason() == null)
            return;

        // Parse OT time range from reason: "18:00 - 21:00 | reason text"
        String reason = req.getReason().trim();
        String timePart = reason.contains("|") ? reason.split("\\|")[0].trim() : reason;
        String[] times = timePart.split("-");
        if (times.length != 2)
            return;

        try {
            LocalTime otStart = LocalTime.parse(times[0].trim());
            LocalTime otEnd = LocalTime.parse(times[1].trim());
            long otMinutes = Duration.between(otStart, otEnd).toMinutes();
            if (otMinutes <= 0)
                return;

            BigDecimal otHours = BigDecimal.valueOf(otMinutes)
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

            // Find attendance log for that employee on the OT date
            Optional<AttendanceLog> logOpt = attendanceLogRepo
                    .findByEmployeeIdAndDate(req.getEmployeeId(), req.getStartDate());

            if (logOpt.isPresent()) {
                // Update existing log
                AttendanceLog log = logOpt.get();
                log.setOtHours(otHours);
                attendanceLogRepo.save(log);
            } else {
                // Create a new log entry for the OT day (employee may not have checked in)
                AttendanceLog newLog = new AttendanceLog();
                newLog.setEmployeeId(req.getEmployeeId());
                newLog.setDate(req.getStartDate());
                newLog.setOtHours(otHours);
                newLog.setWorkingHours(BigDecimal.ZERO);
                attendanceLogRepo.save(newLog);
            }
        } catch (Exception e) {
            // If parsing fails, log but don't block the approval
            System.err.println("Failed to parse OT hours from reason: " + reason + " - " + e.getMessage());
        }
    }

    /**
     * Remove work schedules for the employee during the leave period.
     */
    private void removeWorkSchedulesOnLeave(Request req) {
        if (req.getStartDate() == null)
            return;

        LocalDate endDate = req.getEndDate() != null ? req.getEndDate() : req.getStartDate();

        // Find existing schedules in the date range
        List<com.project.hrm.module.attendance.entity.WorkSchedule> schedules = workScheduleRepo
                .findByEmployeeIdAndDateBetweenOrderByDateAsc(
                        req.getEmployeeId(), req.getStartDate(), endDate);

        if (!schedules.isEmpty()) {
            log.info("Removing {} work schedule(s) for employee {} due to approved leave from {} to {}",
                    schedules.size(), req.getEmployeeId(), req.getStartDate(), endDate);

            // For each schedule, remove associated attendance logs first if any
            for (com.project.hrm.module.attendance.entity.WorkSchedule ws : schedules) {
                attendanceLogRepo.deleteAll(attendanceLogRepo.findByWorkSchedule_ScheduleId(ws.getScheduleId()));
            }

            workScheduleRepo.deleteAll(schedules);
        }
    }

}