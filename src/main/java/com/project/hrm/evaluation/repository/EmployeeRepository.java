package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository
        extends JpaRepository<Employee, Long> {
}
