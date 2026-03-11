package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.recruitment.dto.response.DepartmentResponse;
import com.project.hrm.module.recruitment.dto.response.EmployeeResponse;
import com.project.hrm.module.recruitment.dto.response.PositionResponse;
import com.project.hrm.module.recruitment.repository.RDepartmentRepository;
import com.project.hrm.module.recruitment.repository.REmployeeRepository;
import com.project.hrm.module.recruitment.repository.RPositionRepository;
import com.project.hrm.module.recruitment.service.EDPService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class EDPServiceImpl implements EDPService {
    private final REmployeeRepository REmployeeRepository;
    private final RDepartmentRepository RDepartmentRepository;
    private final RPositionRepository RPositionRepository;

    @Override
    public List<EmployeeResponse> getEmployeeByRole(EmployeeRole role) {
        List<Employee> employees = REmployeeRepository.findByUser_Role(role);

        return employees.stream()
                .map(this::mapToEResponse)
                .toList();
    }

    @Override
    public List<DepartmentResponse> getAllDepartment() {
        List<Department> departments = RDepartmentRepository.findAll();
        return departments.stream()
                .map(this::mapToDResponse)
                .toList();
    }

    @Override
    public DepartmentResponse getDepartmentByManagerId(UUID id) {
        Department department = RDepartmentRepository.findByManager_EmployeeId(id);
        return mapToDResponse(department);
    }

    @Override
    public List<PositionResponse> getPositionByDeptId(UUID deptId) {
        List<Position> position = RPositionRepository.findByDepartment_DeptId(deptId);
        return position.stream()
                .map(this::mapToPResponse)
                .toList();
    }

    private EmployeeResponse mapToEResponse(Employee entity){
        EmployeeResponse response = new EmployeeResponse();
        response.setEmpId(entity.getEmployeeId());
        response.setEmpName(entity.getFullName());
        return response;
    }
    private DepartmentResponse mapToDResponse(Department entity){
        DepartmentResponse response = new DepartmentResponse();
        response.setDeptId(entity.getDeptId());
        response.setDeptName(entity.getDeptName());
        return response;
    }
    private PositionResponse mapToPResponse(Position entity){
        PositionResponse response = new PositionResponse();
        response.setPosId(entity.getPositionId());
        response.setPosName(entity.getTitle());
        return response;
    }
}
