package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.request.CancelOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.HRConfirmOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.OffboardingRequestDTO;
import com.project.hrm.module.corehr.dto.response.OffboardingResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Offboarding;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.OffboardingStatus;
import com.project.hrm.module.corehr.enums.OffboardingType;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.enums.ErrorCode;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.mapper.OffboardingMapper;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.OffboardingRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class OffboardingCommandService {
    private final EmployeeHelper employeeHelper;
    private final OffboardingRepository offboardingRepository;
    private final EmployeeRepository employeeRepository;

    private static final List<EmployeeStatus> OFFBOARDABLE_STATUSES = List.of(
            EmployeeStatus.OFFICIAL, EmployeeStatus.INTERN, EmployeeStatus.PROBATION);

    private static final List<OffboardingStatus> ACTIVE_OFFBOARDING_STATUSES = List.of(
            OffboardingStatus.PENDING, OffboardingStatus.MANAGER_APPROVED, OffboardingStatus.HR_CONFIRMED);

    public OffboardingCommandService(EmployeeHelper employeeHelper,
            OffboardingRepository offboardingRepository,
            EmployeeRepository employeeRepository) {
        this.employeeHelper = employeeHelper;
        this.offboardingRepository = offboardingRepository;
        this.employeeRepository = employeeRepository;
    }

    // ── BRD 3.1: Nghỉ tự nguyện ──
    // Nhân viên tự tạo → Quản lý duyệt → HR điền ngày & xác nhận
    @Transactional
    public OffboardingResponseDTO createResignationRequest(UUID employeeId, OffboardingRequestDTO dto,
            UUID requestedBy) {
        Employee employee = employeeHelper.findEmployeeOrThrow(employeeId);
        validateCanOffboard(employee);

        Offboarding offboarding = Offboarding.builder()
                .employee(employee)
                .type(OffboardingType.RESIGNATION)
                .reason(dto.getReason())
                .expectedLastDay(dto.getExpectedLastDay())
                .requestedBy(requestedBy)
                .previousEmployeeStatus(employee.getStatus())
                .status(OffboardingStatus.PENDING)
                .build();

        offboarding = offboardingRepository.save(offboarding);
        return OffboardingMapper.toDTO(offboarding, employeeRepository);
    }

    // ── BRD 3.1: Sa thải / Hết HĐ / Không vào làm ──
    // Quản lý đề xuất → HR điền ngày & xác nhận (skip manager approve)
    @Transactional
    public OffboardingResponseDTO createManagerProposedRequest(UUID employeeId, OffboardingRequestDTO dto,
            UUID managerId) {
        Employee employee = employeeHelper.findEmployeeOrThrow(employeeId);
        validateCanOffboard(employee);

        OffboardingType type;
        try {
            type = OffboardingType.valueOf(dto.getType());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException(ErrorCode.OFFBOARDING_INVALID_TYPE,
                    "Invalid offboarding type: " + dto.getType());
        }

        if (type == OffboardingType.RESIGNATION) {
            throw new BusinessRuleException(ErrorCode.OFFBOARDING_INVALID_TYPE,
                    "Manager cannot propose RESIGNATION. Use employee self-service.");
        }

        Offboarding offboarding = Offboarding.builder()
                .employee(employee)
                .type(type)
                .reason(dto.getReason())
                .expectedLastDay(dto.getExpectedLastDay())
                .requestedBy(managerId)
                .approvedByManager(managerId)
                .managerApprovedDate(LocalDate.now())
                .previousEmployeeStatus(employee.getStatus())
                .status(OffboardingStatus.MANAGER_APPROVED)
                .build();

        // Khi Quản lý đề xuất nghỉ, nhân viên chuyển sang trạng thái chờ nghỉ (PENDING_OFFBOARD)
        // nhưng vẫn giữ tài khoản ACTIVE để bàn giao cho đến ngày cưới cùng
        employee.setStatus(EmployeeStatus.PENDING_OFFBOARD);
        employeeHelper.save(employee);

        offboarding = offboardingRepository.save(offboarding);
        return OffboardingMapper.toDTO(offboarding, employeeRepository);
    }

    // ── BRD 3.1: Quản lý duyệt yêu cầu nghỉ tự nguyện ──
    @Transactional
    public OffboardingResponseDTO managerApprove(UUID offboardingId, UUID managerId) {
        Offboarding offboarding = findOffboardingOrThrow(offboardingId);

        if (offboarding.getStatus() != OffboardingStatus.PENDING) {
            throw new BusinessRuleException(ErrorCode.OFFBOARDING_INVALID_STATUS,
                    "Only PENDING requests can be approved by manager.");
        }

        offboarding.setStatus(OffboardingStatus.MANAGER_APPROVED);
        offboarding.setApprovedByManager(managerId);
        offboarding.setManagerApprovedDate(LocalDate.now());

        // Khi Quản lý duyệt đơn nghỉ việc, chuyển nhân viên sang PENDING_OFFBOARD
        // Tài khoản User vẫn giữ nguyên ACTIVE để nhân viên làm thủ tục bàn giao
        Employee employee = offboarding.getEmployee();
        employee.setStatus(EmployeeStatus.PENDING_OFFBOARD);
        employeeHelper.save(employee);

        offboarding = offboardingRepository.save(offboarding);
        return OffboardingMapper.toDTO(offboarding, employeeRepository);
    }

    // ── BRD 3.1 + 3.4: HR xác nhận → chuyển PENDING_OFFBOARD ──
    @Transactional
    public OffboardingResponseDTO hrConfirm(UUID offboardingId, HRConfirmOffboardingDTO dto, UUID hrEmployeeId) {
        Offboarding offboarding = findOffboardingOrThrow(offboardingId);

        if (offboarding.getStatus() != OffboardingStatus.MANAGER_APPROVED) {
            throw new BusinessRuleException(ErrorCode.OFFBOARDING_INVALID_STATUS,
                    "Only MANAGER_APPROVED requests can be confirmed by HR.");
        }

        // HR xác nhận — đơn chuyển trạng thái nhưng nhân viên đã được TERMINATED từ bước trước
        offboarding.setStatus(OffboardingStatus.HR_CONFIRMED);
        offboarding.setOfficialLastDay(dto.getOfficialLastDay());
        offboarding.setConfirmedByHr(hrEmployeeId);
        offboarding.setHrConfirmedDate(LocalDate.now());

        offboarding = offboardingRepository.save(offboarding);
        return OffboardingMapper.toDTO(offboarding, employeeRepository);
    }

    // ── BRD 3.2: Hủy yêu cầu (HR, Manager, Employee đều có thể hủy) ──
    @Transactional
    public OffboardingResponseDTO cancelOffboarding(UUID offboardingId, CancelOffboardingDTO dto, UUID cancelledBy) {
        Offboarding offboarding = findOffboardingOrThrow(offboardingId);

        if (!ACTIVE_OFFBOARDING_STATUSES.contains(offboarding.getStatus())) {
            throw new BusinessRuleException(ErrorCode.OFFBOARDING_CANCEL_NOT_ALLOWED,
                    "Cannot cancel offboarding in status: " + offboarding.getStatus());
        }

        // BRD 3.2: Hồ sơ nhân viên trở về trạng thái trước đó
        Employee employee = offboarding.getEmployee();
        if (offboarding.getPreviousEmployeeStatus() != null) {
            employee.setStatus(offboarding.getPreviousEmployeeStatus());
        } else {
            employee.setStatus(EmployeeStatus.OFFICIAL);
        }
        
        // Khôi phục quyền truy cập nếu hủy yêu cầu nghỉ việc
        if (employee.getUser() != null) {
            employee.getUser().setStatus(UserStatus.ACTIVE);
        }
        
        employeeHelper.save(employee);

        offboarding.setStatus(OffboardingStatus.CANCELLED);
        offboarding.setCancelReason(dto.getCancelReason());
        offboarding.setCancelledBy(cancelledBy);
        offboarding.setCancelledDate(LocalDate.now());

        offboarding = offboardingRepository.save(offboarding);
        return OffboardingMapper.toDTO(offboarding, employeeRepository);
    }

    // ── BRD 3.4: Scheduled — xử lý khi đến ngày nghỉ chính thức ──
    @Transactional
    public void processOffboardingOnLastDay() {
        List<Offboarding> confirmedRequests = offboardingRepository
                .findByStatusAndOfficialLastDayLessThanEqual(OffboardingStatus.HR_CONFIRMED, LocalDate.now());

        for (Offboarding offboarding : confirmedRequests) {
            Employee employee = offboarding.getEmployee();

            // Đảm bảo trạng thái cuối cùng là đúng loại nghỉ việc
            if (offboarding.getType() == OffboardingType.RESIGNATION) {
                employee.setStatus(EmployeeStatus.RESIGNED);
            } else {
                employee.setStatus(EmployeeStatus.TERMINATED);
            }
            
            // Đảm bảo User INACTIVE
            if (employee.getUser() != null) {
                employee.getUser().setStatus(UserStatus.INACTIVE);
            }

            employeeHelper.save(employee);

            offboarding.setStatus(OffboardingStatus.COMPLETED);
            offboardingRepository.save(offboarding);
        }
    }

    // ── Legacy: terminate / activate thủ công ──

    @Transactional
    public EmployeeDetailDTO terminateEmployee(UUID id) {
        Employee e = employeeHelper.findEmployeeOrThrow(id);

        if (!OFFBOARDABLE_STATUSES.contains(e.getStatus())) {
            throw new BusinessRuleException(ErrorCode.OFFBOARDING_INVALID_STATUS,
                    "Employee is not in an offboardable status.");
        }

        e.setStatus(EmployeeStatus.TERMINATED);
        if (e.getUser() != null) {
            e.getUser().setStatus(UserStatus.INACTIVE);
        }

        return EmployeeDetailMapper.toDTO(employeeHelper.save(e));
    }

    @Transactional
    public EmployeeDetailDTO activateEmployee(UUID id) {
        Employee e = employeeHelper.findEmployeeOrThrow(id);

        if (e.getStatus() != EmployeeStatus.TERMINATED && e.getStatus() != EmployeeStatus.RESIGNED) {
            throw new BusinessRuleException(ErrorCode.OFFBOARDING_INVALID_STATUS,
                    "Only TERMINATED or RESIGNED employees can be activated.");
        }

        e.setStatus(EmployeeStatus.OFFICIAL);
        if (e.getUser() != null) {
            e.getUser().setStatus(UserStatus.ACTIVE);
        }

        return EmployeeDetailMapper.toDTO(employeeHelper.save(e));
    }

    // ── Helpers ──

    private void validateCanOffboard(Employee employee) {
        if (!OFFBOARDABLE_STATUSES.contains(employee.getStatus())) {
            throw new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_ACTIVE,
                    "Employee is not in an active status (OFFICIAL, INTERN, or PROBATION).");
        }

        boolean hasActive = offboardingRepository.existsByEmployee_EmployeeIdAndStatusIn(
                employee.getEmployeeId(), ACTIVE_OFFBOARDING_STATUSES);
        if (hasActive) {
            throw new BusinessRuleException(ErrorCode.OFFBOARDING_PENDING_EXISTS,
                    "Employee already has an active offboarding request.");
        }
    }

    private Offboarding findOffboardingOrThrow(UUID offboardingId) {
        return offboardingRepository.findByOffboardingId(offboardingId)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.OFFBOARDING_NOT_FOUND,
                        "Offboarding request not found: " + offboardingId));
    }
}
