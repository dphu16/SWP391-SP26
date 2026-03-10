package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.recruitment.dto.response.DepartmentResponse;
import com.project.hrm.module.recruitment.dto.response.EmployeeResponse;
import com.project.hrm.module.recruitment.dto.response.PositionResponse;

import java.util.List;
import java.util.UUID;

public interface EDPService {
    List<EmployeeResponse> getEmployeeByRole(UserRole role);
    List<DepartmentResponse> getAllDepartment();
    DepartmentResponse getDepartmentByManagerId(UUID id);
    List<PositionResponse> getPositionByDeptId(UUID deptId);
}
