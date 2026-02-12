package com.project.hrm.recruitment.repository;

import com.project.hrm.module.corehr.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DepartmentRRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findDepartmentByDeptId(UUID deptId);
}
