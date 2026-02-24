package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class EmployeeCommandService {
    private final EmployeeHelper employeeHelper;

    public EmployeeCommandService(EmployeeHelper employeeHelper) {
        this.employeeHelper = employeeHelper;
    }

    private void applyPersonalInfo(Employee e, EmployeeChangeDTO req) {
        if (req.getFullName() != null)    e.setFullName(req.getFullName());
        if (req.getEmail() != null)       e.setEmail(req.getEmail());
        if (req.getPhone() != null)       e.setPhone(req.getPhone());
        if (req.getAddress() != null)     e.setAddress(req.getAddress());
        if (req.getGender() != null)      e.setGender(req.getGender());
        if (req.getCitizenId() != null)   e.setCitizenId(req.getCitizenId());
        if (req.getTaxCode() != null)     e.setTaxCode(req.getTaxCode());
        if (req.getDateOfBirth() != null) e.setDateOfBirth(req.getDateOfBirth());
        if (req.getDateOfJoining() != null) e.setDateOfJoining(req.getDateOfJoining());
        if (req.getAvatarUrl() != null)   e.setAvatarUrl(req.getAvatarUrl());
    }

    private void applyJobInfo(Employee e, EmployeeChangeDTO req) {
        if (req.getDepartmentId() != null) {
            e.setDepartment(employeeHelper.findDepartmentOrThrow(req.getDepartmentId()));
        }
        if (req.getPositionId() != null) {
            e.setPosition(employeeHelper.findPositionOrThrow(req.getPositionId()));
        }
        if (req.getStatusPos() != null) e.setStatusPos(req.getStatusPos());
    }

    private void applyUserAccount(Employee e, EmployeeChangeDTO req) {
        if (e.getUser() == null) return;
        if (req.getRole() != null)   e.getUser().setRole(req.getRole());
        if (req.getStatus() != null) e.getUser().setStatus(req.getStatus());
        if (req.getEmail() != null)  e.getUser().setEmail(req.getEmail());
    }

    @Transactional
    public EmployeeDetailDTO updateEmployee(UUID id, EmployeeChangeDTO req) {
        Employee e = employeeHelper.findEmployeeOrThrow(id);

        applyPersonalInfo(e, req);
        applyJobInfo(e, req);
        applyUserAccount(e, req);

        return EmployeeDetailMapper.toDTO(employeeHelper.save(e));
    }
}
