package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class OffboardingCommandService {
    private final EmployeeHelper employeeHelper;

    public OffboardingCommandService(EmployeeHelper employeeHelper) {
        this.employeeHelper = employeeHelper;
    }

    @Transactional
    public EmployeeDetailDTO terminateEmployee(UUID id) {
        Employee e = employeeHelper.findEmployeeOrThrow(id);

        if (e.getEmpStatus() != EmployeeStatus.OFFICIAL) {
            throw new IllegalStateException("Only OFFICIAL employees can be terminated.");
        }

        e.setEmpStatus(com.project.hrm.module.corehr.enums.EmployeeStatus.TERMINATED);

        if (e.getUser() != null) {
            e.getUser().setStatus(com.project.hrm.module.corehr.enums.UserStatus.INACTIVE);
        }

        return EmployeeDetailMapper.toDTO(employeeHelper.save(e));
    }

    @Transactional
    public EmployeeDetailDTO activateEmployee(UUID id) {
        Employee e = employeeHelper.findEmployeeOrThrow(id);

        if (e.getEmpStatus() != EmployeeStatus.TERMINATED) {
            throw new IllegalStateException("Only TERMINATED employees can be activated.");
        }

        e.setEmpStatus(com.project.hrm.module.corehr.enums.EmployeeStatus.OFFICIAL);

        if (e.getUser() != null) {
            e.getUser().setStatus(com.project.hrm.module.corehr.enums.UserStatus.ACTIVE);
        }

        return EmployeeDetailMapper.toDTO(employeeHelper.save(e));
    }
}
