package com.project.hrm.module.payroll.service;


import com.project.hrm.module.attendance.dto.AttendanceAggregationDTO;
import com.project.hrm.module.attendance.repository.AttendanceLogRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.BatchStatus;
import com.project.hrm.module.payroll.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollCalculationService {

    private final PayrollBatchRepository batchRepository;
    private final AttendanceLogRepository attendanceRepository;
    private final SalaryProfileRepository profileRepository;
    private final PayrollDetailRepository payrollDetailRepository;
    private final EmployeeRepository employeeRepository; // Để lấy danh sách nhân viên active nếu cần

    @Transactional
    public void calculatePayrollForBatch(UUID batchId) {
        // 1. Lấy thông tin Batch (Kỳ lương)
        PayrollBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        if (batch.getStatus() == BatchStatus.LOCKED || batch.getStatus() == BatchStatus.PROCESSED) {
            throw new RuntimeException("Cannot recalculate a processed/locked batch");
        }

        // Lấy ngày bắt đầu và kết thúc từ Period (Giả sử bạn đã fetch PayrollPeriod)
        // Trong code thực tế bạn cần query PayrollPeriod từ batch.getPeriod() (Date)
        // Ở đây tôi giả định logic lấy ngày đã có:
        LocalDate startDate = batch.getPeriod().withDayOfMonth(1);
        LocalDate endDate = batch.getPeriod().withDayOfMonth(batch.getPeriod().lengthOfMonth());

        // 2. Xóa dữ liệu cũ của Batch này (nếu tính lại) để tránh duplicate
        // payrollDetailRepository.deleteByBatchId(batchId); // Cần implement hàm này

        // 3. Lấy dữ liệu chấm công tổng hợp (Aggregate)
        List<AttendanceAggregationDTO> attendanceData = attendanceRepository
                .aggregateAttendanceByPeriod(startDate, endDate);

        // Chuyển List thành Map để dễ lookup theo EmployeeId
        Map<UUID, AttendanceAggregationDTO> attendanceMap = attendanceData.stream()
                .collect(Collectors.toMap(AttendanceAggregationDTO::getEmployeeId, Function.identity()));

        // 4. Lấy danh sách tất cả nhân viên cần tính lương
        // (Có thể lấy từ bảng employees hoặc từ danh sách đã chấm công)
        List<Employee> employees = employeeRepository.findAll(); // Nên filter status ACTIVE

        // 5. Duyệt từng nhân viên để tạo PayrollDetail
        for (Employee emp : employees) {
            // A. Lấy lương cơ bản (Salary Profile)
            SalaryProfile profile = profileRepository
                    .findActiveProfileForPeriod(emp.getEmployeeId(), startDate, endDate)
                    .orElse(null);

            if (profile == null) {
                // Skip hoặc log warning nếu nhân viên không có cấu hình lương
                continue;
            }

            // B. Lấy dữ liệu chấm công (nếu không có thì mặc định là 0)
            AttendanceAggregationDTO att = attendanceMap.getOrDefault(
                    emp.getEmployeeId(),
                    new AttendanceAggregationDTO(emp.getEmployeeId(), BigDecimal.ZERO, BigDecimal.ZERO, 0L)
            );

            // C. Tạo PayrollDetail
            PayrollDetail detail = new PayrollDetail();
            detail.setPayrollBatch(batch);
            detail.setEmployee(emp);

            // Set thông tin Lương & Chấm công
            detail.setBaseSalary(profile.getBaseSalary());
            detail.setTotalOtHours(att.getTotalOtHours());
            detail.setTotalAbsentDays(BigDecimal.valueOf(att.getTotalAbsentDays())); // Convert Long to BigDecimal

            // NOTE: Các trường otPay, absentDeduction, grossSalary, netSalary
            // sẽ được tính ở bước tiếp theo hoặc tính luôn ở đây nếu bạn đã có công thức.
            // Ví dụ tính sơ bộ:
            // detail.setGrossSalary(profile.getBaseSalary().add( ...tính tiền OT... ));

            payrollDetailRepository.save(detail);
        }

        // 6. Cập nhật trạng thái Batch
        batch.setStatus(BatchStatus.PROCESSED);
        batchRepository.save(batch);
    }
}
