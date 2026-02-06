package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {

}