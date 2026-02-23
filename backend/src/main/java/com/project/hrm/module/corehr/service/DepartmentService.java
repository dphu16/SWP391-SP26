package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.dto.response.DepartmentResponse;
import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DepartmentResponse getDepartmentById(UUID id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        return mapToResponse(dept);
    }

    private DepartmentResponse mapToResponse(Department dept) {
        return DepartmentResponse.builder()
                .deptId(dept.getDeptId())
                .deptName(dept.getDeptName())
                .description(dept.getDescription())
                .build();
    }
}
