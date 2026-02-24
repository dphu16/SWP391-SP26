package com.project.hrm.recruitment.repository;

import com.project.hrm.module.corehr.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface REmployeeRepository extends JpaRepository<Employee, UUID> {

}
