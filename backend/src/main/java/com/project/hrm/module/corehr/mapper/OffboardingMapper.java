package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.response.OffboardingResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Offboarding;
import com.project.hrm.module.corehr.repository.EmployeeRepository;

import java.util.UUID;

public class OffboardingMapper {

    private OffboardingMapper() {
    }

    public static OffboardingResponseDTO toDTO(Offboarding o, EmployeeRepository employeeRepository) {
        Employee emp = o.getEmployee();

        OffboardingResponseDTO.OffboardingResponseDTOBuilder builder = OffboardingResponseDTO.builder()
                .offboardingId(o.getOffboardingId())
                .employeeId(emp.getEmployeeId())
                .employeeCode(emp.getEmployeeCode())
                .employeeName(emp.getFullName())
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getDeptName() : null)
                .positionTitle(emp.getPosition() != null ? emp.getPosition().getTitle() : null)
                .avatarUrl(emp.getPersonal() != null ? emp.getPersonal().getAvatar() : null)
                .type(o.getType())
                .status(o.getStatus())
                .reason(o.getReason())
                .requestDate(o.getRequestDate())
                .expectedLastDay(o.getExpectedLastDay())
                .officialLastDay(o.getOfficialLastDay())
                .requestedBy(o.getRequestedBy())
                .approvedByManager(o.getApprovedByManager())
                .managerApprovedDate(o.getManagerApprovedDate())
                .confirmedByHr(o.getConfirmedByHr())
                .hrConfirmedDate(o.getHrConfirmedDate())
                .cancelReason(o.getCancelReason())
                .cancelledBy(o.getCancelledBy())
                .cancelledDate(o.getCancelledDate());

        // Resolve names for requestedBy, approvedByManager, confirmedByHr, cancelledBy
        if (o.getRequestedBy() != null) {
            builder.requestedByName(resolveEmployeeName(o.getRequestedBy(), employeeRepository));
        }
        if (o.getApprovedByManager() != null) {
            builder.approvedByManagerName(resolveEmployeeName(o.getApprovedByManager(), employeeRepository));
        }
        if (o.getConfirmedByHr() != null) {
            builder.confirmedByHrName(resolveEmployeeName(o.getConfirmedByHr(), employeeRepository));
        }
        if (o.getCancelledBy() != null) {
            builder.cancelledByName(resolveEmployeeName(o.getCancelledBy(), employeeRepository));
        }

        return builder.build();
    }

    private static String resolveEmployeeName(UUID employeeId, EmployeeRepository employeeRepository) {
        return employeeRepository.findById(employeeId)
                .map(Employee::getFullName)
                .orElse(null);
    }
}
