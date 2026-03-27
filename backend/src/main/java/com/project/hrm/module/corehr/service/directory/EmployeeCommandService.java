package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Role;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.repository.RoleRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

@Service
public class EmployeeCommandService {
    private final EmployeeHelper employeeHelper;
    private final RoleRepository roleRepository;

    public EmployeeCommandService(EmployeeHelper employeeHelper,
            RoleRepository roleRepository) {
        this.employeeHelper = employeeHelper;
        this.roleRepository = roleRepository;
    }

    private void applyPersonalInfo(Employee e, EmployeeChangeDTO req) {
        if (req.getFullName() != null)
            e.setFullName(req.getFullName());

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
            if (e.getPosition().getDepartment() != null) {
                e.setDepartment(e.getPosition().getDepartment());
            }
        }
        
        if (e.getDepartment() != null) {
            e.setManager(e.getDepartment().getManager());
            e.setMentor(e.getDepartment().getMentor());
        }

        if (req.getEmpStatus() != null) {
            e.setStatus(req.getEmpStatus());
        }
    }

    private void applyUserAccount(Employee e, EmployeeChangeDTO req) {
        if (e.getUser() == null)
            return;

        if (req.getRole() != null) {
            Role role = roleRepository.findByName(req.getRole())
                    .orElseThrow(() -> new RuntimeException("Role không tồn tại"));
            e.getUser().setRoles(Set.of(role));
        }

        if (req.getEmpStatus() != null) {
            UserStatus userStatus = switch (req.getEmpStatus()) {
                case OFFICIAL, INTERN, PROBATION -> UserStatus.ACTIVE;
                case TERMINATED, RESIGNED -> UserStatus.INACTIVE;
                default -> UserStatus.INACTIVE;
            };
            e.getUser().setStatus(userStatus);
        }
    }

    @Transactional
    public EmployeeDetailDTO updateEmployee(UUID id, EmployeeChangeDTO req) {
        Employee e = employeeHelper.findEmployeeOrThrow(id);

        applyPersonalInfo(e, req);
        applyJobInfo(e, req);
        applyUserAccount(e, req);

        Employee saved = employeeHelper.save(e);

        return EmployeeDetailMapper.toDTO(saved);
    }
}
