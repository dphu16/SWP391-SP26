package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    @Override
    Optional<Employee> findById(UUID uuid);
}
