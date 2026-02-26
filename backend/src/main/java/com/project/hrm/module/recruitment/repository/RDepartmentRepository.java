package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.corehr.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RDepartmentRepository extends JpaRepository<Department, UUID> {

}