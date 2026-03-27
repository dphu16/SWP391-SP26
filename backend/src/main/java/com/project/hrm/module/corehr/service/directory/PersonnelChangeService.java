package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.PersonnelChangeRequestDTO;
import com.project.hrm.module.corehr.dto.response.PersonnelChangeResponseDTO;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.PersonnelChangeStatus;
import com.project.hrm.module.corehr.enums.PersonnelChangeType;
import com.project.hrm.module.corehr.repository.DepartmentRepository;

import com.project.hrm.module.corehr.repository.PersonnelChangeRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PersonnelChangeService {

    private final PersonnelChangeRepository changeRepository;
    private final EmployeeHelper employeeHelper;
    private final DepartmentRepository departmentRepository;

    public PersonnelChangeService(PersonnelChangeRepository changeRepository,
            EmployeeHelper employeeHelper,
            DepartmentRepository departmentRepository) {
        this.changeRepository = changeRepository;
        this.employeeHelper = employeeHelper;
        this.departmentRepository = departmentRepository;
    }

    /**
     * Lấy department mà manager này quản lý.
     * Ném ngoại lệ nếu manager không phụ trách phòng nào.
     */
    private Department resolveManagerDepartment(UUID managerId) {
        Department dept = departmentRepository.findByManager_EmployeeId(managerId);
        if (dept == null) {
            throw new RuntimeException("Bạn không phụ trách phòng ban nào, không thể thực hiện yêu cầu này.");
        }
        return dept;
    }

    /**
     * Kiểm tra nhân viên target có thuộc phòng mà manager quản lý không.
     */
    private void validateManagerCanActOnEmployee(UUID managerId, Employee employee) {
        Department managedDept = resolveManagerDepartment(managerId);
        UUID employeeDeptId = employee.getDepartment() != null ? employee.getDepartment().getDeptId() : null;
        if (employeeDeptId == null || !managedDept.getDeptId().equals(employeeDeptId)) {
            throw new RuntimeException(
                    "Bạn chỉ có thể thực hiện yêu cầu thay đổi thông tin cho nhân viên thuộc phòng " +
                            managedDept.getDeptName() + ".");
        }
    }

    @Transactional
    public PersonnelChangeResponseDTO createRequest(PersonnelChangeRequestDTO dto, UUID requestedBy, boolean isHr) {
        Employee employee = employeeHelper.findEmployeeOrThrow(dto.getEmployeeId());

        if (dto.getChangeType() == PersonnelChangeType.DEPARTMENT_TRANSFER) {
            if (!isHr) {
                throw new RuntimeException("Chỉ HR mới được quyền tạo yêu cầu điều chuyển phòng ban.");
            }
        } else {
            if (!isHr) {
                validateManagerCanActOnEmployee(requestedBy, employee);
            }
        }

        // BRD 2.4: Intern can't have salary change
        if (dto.getChangeType() == PersonnelChangeType.SALARY_CHANGE
                && employee.getStatus() == EmployeeStatus.INTERN) {
            throw new RuntimeException("Nhân viên thực tập không được phép thay đổi lương.");
        }

        Map<String, Object> oldValues = buildOldValues(employee, dto.getChangeType());
        Map<String, Object> newValues = buildNewValues(dto);

        PersonnelChangeStatus initialStatus = PersonnelChangeStatus.MANAGER_APPROVED;
        if (dto.getChangeType() == PersonnelChangeType.DEPARTMENT_TRANSFER) {
            initialStatus = PersonnelChangeStatus.PENDING;
            newValues.put("oldManagerApproved", false);
            newValues.put("newManagerApproved", false);

            // Auto-approve the side(s) where the HR requestor is also the manager,
            // to avoid a self-approval deadlock.
            Department hrManagedDept = departmentRepository.findByManager_EmployeeId(requestedBy);
            if (hrManagedDept != null) {
                UUID oldDeptId = employee.getDepartment() != null ? employee.getDepartment().getDeptId() : null;
                UUID newDeptId = null;
                if (newValues.containsKey("departmentId")) {
                    newDeptId = UUID.fromString(newValues.get("departmentId").toString());
                }
                if (hrManagedDept.getDeptId().equals(oldDeptId)) {
                    newValues.put("oldManagerApproved", true);
                }
                if (hrManagedDept.getDeptId().equals(newDeptId)) {
                    newValues.put("newManagerApproved", true);
                }
                // If HR manages both sides, skip manager approval entirely
                boolean oldApproved = Boolean.TRUE.equals(newValues.get("oldManagerApproved"));
                boolean newApproved = Boolean.TRUE.equals(newValues.get("newManagerApproved"));
                if (oldApproved && newApproved) {
                    initialStatus = PersonnelChangeStatus.MANAGER_APPROVED;
                }
            }
        }

        PersonnelChange change = PersonnelChange.builder()
                .employee(employee)
                .changeType(dto.getChangeType())
                .status(initialStatus)
                .reason(dto.getReason())
                .oldValues(oldValues)
                .newValues(newValues)
                .requestedBy(requestedBy)
                .managerApprovedBy(requestedBy)
                .managerApprovedDate(java.time.LocalDateTime.now())
                .build();

        PersonnelChange saved = changeRepository.save(change);
        return toResponseDTO(saved);
    }

    @Transactional
    public PersonnelChangeResponseDTO managerApprove(UUID changeId, UUID managerId) {
        PersonnelChange change = findOrThrow(changeId);
        if (change.getStatus() != PersonnelChangeStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể duyệt yêu cầu ở trạng thái PENDING.");
        }

        if (change.getChangeType() == PersonnelChangeType.DEPARTMENT_TRANSFER) {
            Department managerDept = resolveManagerDepartment(managerId);
            UUID employeeDeptId = change.getEmployee().getDepartment() != null
                    ? change.getEmployee().getDepartment().getDeptId()
                    : null;
            UUID newDeptId = null;

            if (change.getNewValues() != null && change.getNewValues().containsKey("departmentId")) {
                newDeptId = UUID.fromString(change.getNewValues().get("departmentId").toString());
            }

            boolean isOldManager = employeeDeptId != null && employeeDeptId.equals(managerDept.getDeptId());
            boolean isNewManager = newDeptId != null && newDeptId.equals(managerDept.getDeptId());

            if (!isOldManager && !isNewManager) {
                throw new RuntimeException("Bạn không có quyền duyệt yêu cầu điều chuyển này.");
            }

            if (isOldManager)
                change.getNewValues().put("oldManagerApproved", true);
            if (isNewManager)
                change.getNewValues().put("newManagerApproved", true);

            // Xử lý case manager cũ và mới là 1 người
            if (isOldManager && isNewManager) {
                change.getNewValues().put("oldManagerApproved", true);
                change.getNewValues().put("newManagerApproved", true);
            }

            boolean oldApproved = change.getNewValues() != null
                    && change.getNewValues().containsKey("oldManagerApproved")
                    && Boolean.TRUE.equals(change.getNewValues().get("oldManagerApproved"));
            boolean newApproved = change.getNewValues() != null
                    && change.getNewValues().containsKey("newManagerApproved")
                    && Boolean.TRUE.equals(change.getNewValues().get("newManagerApproved"));

            if (oldApproved && newApproved) {
                applyChange(change);
                change.setStatus(PersonnelChangeStatus.HR_CONFIRMED); // Xem như hoàn thành khi cả 2 đã duyệt
                change.setHrConfirmedBy(managerId); // Có thể gán tạm hoặc để null
                change.setHrConfirmedDate(java.time.LocalDateTime.now());
            }

            change.setManagerApprovedBy(managerId);
            change.setManagerApprovedDate(java.time.LocalDateTime.now());
            return toResponseDTO(changeRepository.save(change));
        }

        // Với các loại request khác
        validateManagerCanActOnEmployee(managerId, change.getEmployee());

        change.setStatus(PersonnelChangeStatus.MANAGER_APPROVED);
        change.setManagerApprovedBy(managerId);
        change.setManagerApprovedDate(java.time.LocalDateTime.now());

        return toResponseDTO(changeRepository.save(change));
    }

    @Transactional
    public PersonnelChangeResponseDTO hrConfirm(UUID changeId, UUID hrEmployeeId) {
        PersonnelChange change = findOrThrow(changeId);
        if (change.getChangeType() == PersonnelChangeType.DEPARTMENT_TRANSFER
                && change.getStatus() != PersonnelChangeStatus.MANAGER_APPROVED) {
            throw new RuntimeException("Chỉ có thể xác nhận yêu cầu Điều chuyển bộ phận đã được Quản lý duyệt.");
        }

        if (change.getStatus() == PersonnelChangeStatus.REJECTED
                || change.getStatus() == PersonnelChangeStatus.HR_CONFIRMED) {
            throw new RuntimeException("Yêu cầu này không thể xác nhận ở trạng thái hiện tại.");
        }

        // Apply the change to employee
        applyChange(change);

        change.setStatus(PersonnelChangeStatus.HR_CONFIRMED);
        change.setHrConfirmedBy(hrEmployeeId);
        change.setHrConfirmedDate(java.time.LocalDateTime.now());

        return toResponseDTO(changeRepository.save(change));
    }

    @Transactional
    public PersonnelChangeResponseDTO reject(UUID changeId, String rejectReason, UUID rejectedBy, boolean isManager) {
        PersonnelChange change = findOrThrow(changeId);
        if (change.getStatus() == PersonnelChangeStatus.HR_CONFIRMED) {
            throw new RuntimeException("Không thể từ chối yêu cầu đã được xác nhận.");
        }

        // Nếu là manager, kiểm tra xem họ có quyền quản lý phòng ban cũ hoặc mới (đối
        // với điều chuyển)
        if (isManager) {
            Department managerDept = resolveManagerDepartment(rejectedBy);
            UUID employeeDeptId = change.getEmployee().getDepartment() != null
                    ? change.getEmployee().getDepartment().getDeptId()
                    : null;

            boolean isAuthorized = false;
            if (employeeDeptId != null && employeeDeptId.equals(managerDept.getDeptId())) {
                isAuthorized = true;
            } else if (change.getChangeType() == PersonnelChangeType.DEPARTMENT_TRANSFER) {
                // Nếu là bộ phận mới, manager mới cũng được quyền từ chối (abort)
                if (change.getNewValues() != null && change.getNewValues().containsKey("departmentId")) {
                    UUID newDeptId = UUID.fromString(change.getNewValues().get("departmentId").toString());
                    if (newDeptId.equals(managerDept.getDeptId())) {
                        isAuthorized = true;
                    }
                }
            }
            if (!isAuthorized) {
                throw new RuntimeException("Bạn không có quyền từ chối yêu cầu này.");
            }
        }

        change.setStatus(PersonnelChangeStatus.REJECTED);
        change.setRejectReason(rejectReason);
        change.setRejectedBy(rejectedBy);

        return toResponseDTO(changeRepository.save(change));
    }

    /** Dành cho HR: lấy tất cả yêu cầu chờ xử lý */
    public List<PersonnelChangeResponseDTO> getPendingRequests() {
        List<PersonnelChangeStatus> statuses = List.of(
                PersonnelChangeStatus.PENDING,
                PersonnelChangeStatus.MANAGER_APPROVED);
        return changeRepository.findByStatusInOrderByCreatedAtDesc(statuses).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Dành cho Manager: chỉ lấy yêu cầu liên quan đến nhân viên trong phòng mình
     */
    public List<PersonnelChangeResponseDTO> getPendingRequestsForManager(UUID managerId) {
        Department managedDept = resolveManagerDepartment(managerId);
        List<PersonnelChangeStatus> statuses = List.of(
                PersonnelChangeStatus.PENDING,
                PersonnelChangeStatus.MANAGER_APPROVED);
        return changeRepository.findByStatusInOrderByCreatedAtDesc(statuses).stream()
                .filter(c -> {
                    if (c.getEmployee() == null)
                        return false;
                    UUID empDeptId = c.getEmployee().getDepartment() != null
                            ? c.getEmployee().getDepartment().getDeptId()
                            : null;
                    boolean isOldDeptDept = managedDept.getDeptId().equals(empDeptId);

                    if (c.getChangeType() == PersonnelChangeType.DEPARTMENT_TRANSFER) {
                        UUID newDeptId = null;
                        if (c.getNewValues() != null && c.getNewValues().containsKey("departmentId")) {
                            newDeptId = UUID.fromString(c.getNewValues().get("departmentId").toString());
                        }
                        boolean isNewDeptDept = managedDept.getDeptId().equals(newDeptId);

                        return isOldDeptDept || isNewDeptDept;
                    }
                    return isOldDeptDept;
                })
                .map(change -> {
                    PersonnelChangeResponseDTO dto = toResponseDTO(change);
                    // Dynamically map status so it appears in "Approved" tab for managers who
                    // already voted.
                    if (change.getChangeType() == PersonnelChangeType.DEPARTMENT_TRANSFER
                            && change.getStatus() == PersonnelChangeStatus.PENDING) {
                        UUID newDeptId = null;
                        if (change.getNewValues() != null && change.getNewValues().containsKey("departmentId")) {
                            newDeptId = UUID.fromString(change.getNewValues().get("departmentId").toString());
                        }
                        boolean isOldDeptDept = change.getEmployee() != null
                                && change.getEmployee().getDepartment() != null
                                && change.getEmployee().getDepartment().getDeptId().equals(managedDept.getDeptId());
                        boolean isNewDeptDept = managedDept.getDeptId().equals(newDeptId);

                        boolean oldApprv = change.getNewValues() != null
                                && Boolean.TRUE.equals(change.getNewValues().get("oldManagerApproved"));
                        boolean newApprv = change.getNewValues() != null
                                && Boolean.TRUE.equals(change.getNewValues().get("newManagerApproved"));

                        if ((isOldDeptDept && oldApprv) || (isNewDeptDept && newApprv)) {
                            dto.setStatus(PersonnelChangeStatus.MANAGER_APPROVED);
                        }
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<PersonnelChangeResponseDTO> getMyRequests(UUID requestedBy) {
        return changeRepository.findByRequestedByOrderByCreatedAtDesc(requestedBy).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /** Dành cho HR: xem lịch sử thay đổi của bất kỳ nhân viên nào */
    public List<PersonnelChangeResponseDTO> getEmployeeHistory(UUID employeeId) {
        return changeRepository.findByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /** Dành cho Manager: chỉ xem lịch sử của nhân viên thuộc phòng mình */
    public List<PersonnelChangeResponseDTO> getEmployeeHistoryForManager(UUID employeeId, UUID managerId) {
        Employee employee = employeeHelper.findEmployeeOrThrow(employeeId);
        validateManagerCanActOnEmployee(managerId, employee);
        return changeRepository.findByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    private void applyChange(PersonnelChange change) {
        Employee employee = change.getEmployee();
        Map<String, Object> newValues = change.getNewValues();

        switch (change.getChangeType()) {
            case DEPARTMENT_TRANSFER -> {
                Department newDept = null;
                if (newValues.containsKey("positionId")) {
                    UUID posId = UUID.fromString(newValues.get("positionId").toString());
                    Position position = employeeHelper.findPositionOrThrow(posId);
                    employee.setPosition(position);
                    if (position.getDepartment() != null) {
                        newDept = position.getDepartment();
                    } else if (newValues.containsKey("departmentId")) {
                        UUID deptId = UUID.fromString(newValues.get("departmentId").toString());
                        newDept = employeeHelper.findDepartmentOrThrow(deptId);
                    }
                } else if (newValues.containsKey("departmentId")) {
                    UUID deptId = UUID.fromString(newValues.get("departmentId").toString());
                    newDept = employeeHelper.findDepartmentOrThrow(deptId);
                }

                if (newDept != null) {
                    employee.setDepartment(newDept);
                    employee.setManager(newDept.getManager());
                    employee.setMentor(newDept.getMentor());
                }
            }
            case SALARY_CHANGE -> {
                if (newValues.containsKey("baseSalary") && employee.getContract() != null) {
                    BigDecimal newSalary = new BigDecimal(newValues.get("baseSalary").toString());
                    Contract contract = employee.getContract();
                    if (contract.getEndDate() == null || contract.getEndDate().isAfter(LocalDate.now())) {
                        contract.setBaseSalary(newSalary);
                    }
                }
            }
        }

        employeeHelper.save(employee);
    }

    private Map<String, Object> buildOldValues(Employee employee, PersonnelChangeType type) {
        Map<String, Object> old = new HashMap<>();
        switch (type) {
            case DEPARTMENT_TRANSFER -> {
                if (employee.getDepartment() != null) {
                    old.put("departmentId", employee.getDepartment().getDeptId().toString());
                    old.put("departmentName", employee.getDepartment().getDeptName());
                }
                if (employee.getPosition() != null) {
                    old.put("positionId", employee.getPosition().getPositionId().toString());
                    old.put("positionTitle", employee.getPosition().getTitle());
                }
            }
            case SALARY_CHANGE -> {
                if (employee.getContract() != null) {
                    Contract contract = employee.getContract();
                    if (contract.getEndDate() == null || contract.getEndDate().isAfter(LocalDate.now())) {
                        old.put("baseSalary", contract.getBaseSalary());
                    }
                }
            }
        }
        return old;
    }

    private Map<String, Object> buildNewValues(PersonnelChangeRequestDTO dto) {
        Map<String, Object> newVals = new HashMap<>();
        switch (dto.getChangeType()) {
            case DEPARTMENT_TRANSFER -> {
                if (dto.getNewPositionId() != null) {
                    Position pos = employeeHelper.findPositionOrThrow(dto.getNewPositionId());
                    newVals.put("positionId", dto.getNewPositionId().toString());
                    newVals.put("positionTitle", pos.getTitle());
                    // Department is derived from the position's department
                    if (pos.getDepartment() != null) {
                        newVals.put("departmentId", pos.getDepartment().getDeptId().toString());
                        newVals.put("departmentName", pos.getDepartment().getDeptName());
                    } else if (dto.getNewDepartmentId() != null) {
                        Department dept = employeeHelper.findDepartmentOrThrow(dto.getNewDepartmentId());
                        newVals.put("departmentId", dto.getNewDepartmentId().toString());
                        newVals.put("departmentName", dept.getDeptName());
                    }
                } else if (dto.getNewDepartmentId() != null) {
                    Department dept = employeeHelper.findDepartmentOrThrow(dto.getNewDepartmentId());
                    newVals.put("departmentId", dto.getNewDepartmentId().toString());
                    newVals.put("departmentName", dept.getDeptName());
                }
            }
            case SALARY_CHANGE -> {
                if (dto.getNewSalary() != null) {
                    newVals.put("baseSalary", dto.getNewSalary());
                }
            }
        }
        return newVals;
    }

    private PersonnelChange findOrThrow(UUID changeId) {
        return changeRepository.findById(changeId)
                .orElseThrow(() -> new RuntimeException("Personnel change request not found: " + changeId));
    }

    private PersonnelChangeResponseDTO toResponseDTO(PersonnelChange change) {
        Employee employee = change.getEmployee();
        String employeeName = employee != null ? employee.getFullName() : null;
        String employeeCode = employee != null ? employee.getEmployeeCode() : null;
        String departmentName = employee != null && employee.getDepartment() != null
                ? employee.getDepartment().getDeptName()
                : null;

        return PersonnelChangeResponseDTO.builder()
                .changeId(change.getChangeId())
                .employeeId(employee != null ? employee.getEmployeeId() : null)
                .employeeName(employeeName)
                .employeeCode(employeeCode)
                .departmentName(departmentName)
                .changeType(change.getChangeType())
                .status(change.getStatus())
                .reason(change.getReason())
                .oldValues(change.getOldValues())
                .newValues(change.getNewValues())
                .requestedBy(change.getRequestedBy())
                .managerApprovedBy(change.getManagerApprovedBy())
                .managerApprovedDate(change.getManagerApprovedDate())
                .hrConfirmedBy(change.getHrConfirmedBy())
                .hrConfirmedDate(change.getHrConfirmedDate())
                .rejectReason(change.getRejectReason())
                .createdAt(change.getCreatedAt())
                .build();
    }
}
