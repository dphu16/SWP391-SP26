package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.PersonnelChangeRequestDTO;
import com.project.hrm.module.corehr.dto.response.PersonnelChangeResponseDTO;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.PersonnelChangeStatus;
import com.project.hrm.module.corehr.enums.PersonnelChangeType;
import com.project.hrm.module.corehr.repository.ContractRepository;
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
    private final ContractRepository contractRepository;

    public PersonnelChangeService(PersonnelChangeRepository changeRepository,
            EmployeeHelper employeeHelper,
            ContractRepository contractRepository) {
        this.changeRepository = changeRepository;
        this.employeeHelper = employeeHelper;
        this.contractRepository = contractRepository;
    }

    @Transactional
    public PersonnelChangeResponseDTO createRequest(PersonnelChangeRequestDTO dto, UUID requestedBy) {
        Employee employee = employeeHelper.findEmployeeOrThrow(dto.getEmployeeId());

        // BRD 2.4: Intern can't have salary change
        if (dto.getChangeType() == PersonnelChangeType.SALARY_CHANGE
                && employee.getStatus() == EmployeeStatus.INTERN) {
            throw new RuntimeException("Nhân viên thực tập không được phép thay đổi lương.");
        }

        Map<String, Object> oldValues = buildOldValues(employee, dto.getChangeType());
        Map<String, Object> newValues = buildNewValues(dto);

        PersonnelChange change = PersonnelChange.builder()
                .employee(employee)
                .changeType(dto.getChangeType())
                .status(PersonnelChangeStatus.PENDING)
                .reason(dto.getReason())
                .oldValues(oldValues)
                .newValues(newValues)
                .requestedBy(requestedBy)
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

        change.setStatus(PersonnelChangeStatus.MANAGER_APPROVED);
        change.setManagerApprovedBy(managerId);
        change.setManagerApprovedDate(java.time.LocalDateTime.now());

        return toResponseDTO(changeRepository.save(change));
    }

    @Transactional
    public PersonnelChangeResponseDTO hrConfirm(UUID changeId, UUID hrEmployeeId) {
        PersonnelChange change = findOrThrow(changeId);
        if (change.getStatus() != PersonnelChangeStatus.MANAGER_APPROVED) {
            throw new RuntimeException("Chỉ có thể xác nhận yêu cầu đã được Quản lý duyệt.");
        }

        // Apply the change to employee
        applyChange(change);

        change.setStatus(PersonnelChangeStatus.HR_CONFIRMED);
        change.setHrConfirmedBy(hrEmployeeId);
        change.setHrConfirmedDate(java.time.LocalDateTime.now());

        return toResponseDTO(changeRepository.save(change));
    }

    @Transactional
    public PersonnelChangeResponseDTO reject(UUID changeId, String rejectReason, UUID rejectedBy) {
        PersonnelChange change = findOrThrow(changeId);
        if (change.getStatus() == PersonnelChangeStatus.HR_CONFIRMED) {
            throw new RuntimeException("Không thể từ chối yêu cầu đã được xác nhận.");
        }

        change.setStatus(PersonnelChangeStatus.REJECTED);
        change.setRejectReason(rejectReason);
        change.setRejectedBy(rejectedBy);

        return toResponseDTO(changeRepository.save(change));
    }

    public List<PersonnelChangeResponseDTO> getPendingRequests() {
        List<PersonnelChangeStatus> statuses = List.of(
                PersonnelChangeStatus.PENDING,
                PersonnelChangeStatus.MANAGER_APPROVED);
        return changeRepository.findByStatusInOrderByCreatedAtDesc(statuses).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PersonnelChangeResponseDTO> getEmployeeHistory(UUID employeeId) {
        return changeRepository.findByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    private void applyChange(PersonnelChange change) {
        Employee employee = change.getEmployee();
        Map<String, Object> newValues = change.getNewValues();

        switch (change.getChangeType()) {
            case DEPARTMENT_TRANSFER -> {
                if (newValues.containsKey("departmentId")) {
                    UUID deptId = UUID.fromString(newValues.get("departmentId").toString());
                    employee.setDepartment(employeeHelper.findDepartmentOrThrow(deptId));
                }
                if (newValues.containsKey("positionId")) {
                    UUID posId = UUID.fromString(newValues.get("positionId").toString());
                    employee.setPosition(employeeHelper.findPositionOrThrow(posId));
                }
            }
            case TITLE_CHANGE -> {
                if (newValues.containsKey("positionId")) {
                    UUID posId = UUID.fromString(newValues.get("positionId").toString());
                    employee.setPosition(employeeHelper.findPositionOrThrow(posId));
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
            case DISCIPLINE, REWARD -> {
                // Discipline and reward are recorded as history entries
                // No direct field changes needed
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
            case TITLE_CHANGE -> {
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
            case DISCIPLINE, REWARD -> {
                // No old values for these types
            }
        }
        return old;
    }

    private Map<String, Object> buildNewValues(PersonnelChangeRequestDTO dto) {
        Map<String, Object> newVals = new HashMap<>();
        switch (dto.getChangeType()) {
            case DEPARTMENT_TRANSFER -> {
                if (dto.getNewDepartmentId() != null) {
                    Department dept = employeeHelper.findDepartmentOrThrow(dto.getNewDepartmentId());
                    newVals.put("departmentId", dto.getNewDepartmentId().toString());
                    newVals.put("departmentName", dept.getDeptName());
                }
                if (dto.getNewPositionId() != null) {
                    Position pos = employeeHelper.findPositionOrThrow(dto.getNewPositionId());
                    newVals.put("positionId", dto.getNewPositionId().toString());
                    newVals.put("positionTitle", pos.getTitle());
                }
            }
            case TITLE_CHANGE -> {
                if (dto.getNewPositionId() != null) {
                    Position pos = employeeHelper.findPositionOrThrow(dto.getNewPositionId());
                    newVals.put("positionId", dto.getNewPositionId().toString());
                    newVals.put("positionTitle", pos.getTitle());
                }
            }
            case SALARY_CHANGE -> {
                if (dto.getNewSalary() != null) {
                    newVals.put("baseSalary", dto.getNewSalary());
                }
            }
            case DISCIPLINE, REWARD -> {
                if (dto.getDescription() != null) {
                    newVals.put("description", dto.getDescription());
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
