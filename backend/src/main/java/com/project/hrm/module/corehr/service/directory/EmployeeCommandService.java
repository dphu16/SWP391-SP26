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
        if (req.getFullName() != null)
            e.setFullName(req.getFullName());
        if (req.getEmail() != null)
            e.getPersonal().setEmail(req.getEmail());
        if (req.getPhone() != null)
            e.getPersonal().setPhone(req.getPhone());
        if (req.getAddress() != null)
            e.getPersonal().setAddress(req.getAddress());
        if (req.getGender() != null)
            e.getPersonal().setGender(req.getGender());
        if (req.getCitizenId() != null)
            e.getPersonal().setCitizenId(req.getCitizenId());
        if (req.getTaxCode() != null)
            e.getPersonal().setTaxCode(req.getTaxCode());
        if (req.getDateOfBirth() != null)
            e.getPersonal().setDateOfBirth(req.getDateOfBirth());
        if (req.getDateOfJoining() != null)
            e.setDateOfJoining(req.getDateOfJoining());
        if (req.getAvatarUrl() != null)
            e.getPersonal().setAvatar(req.getAvatarUrl());
    }

    private void applyJobInfo(Employee e, EmployeeChangeDTO req) {
        if (req.getDepartmentId() != null) {
            e.setDepartment(employeeHelper.findDepartmentOrThrow(req.getDepartmentId()));
        }
        if (req.getPositionId() != null) {
            e.setPosition(employeeHelper.findPositionOrThrow(req.getPositionId()));
        }
        if (req.getEmpStatus() != null)
            e.setEmpStatus(req.getEmpStatus());
    }

    private void applyUserAccount(Employee e, EmployeeChangeDTO req) {
        if (e.getUser() == null)
            return;
        if (req.getRole() != null)
            e.getUser().setRole(req.getRole());
        if (req.getUserStatus() != null)
            e.getUser().setStatus(req.getUserStatus());
        if (req.getEmail() != null)
            e.getPersonal().setEmail(req.getEmail());
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
