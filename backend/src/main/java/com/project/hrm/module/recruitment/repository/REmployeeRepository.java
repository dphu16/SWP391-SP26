package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface REmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findByUser_Role(EmployeeRole role);
}
