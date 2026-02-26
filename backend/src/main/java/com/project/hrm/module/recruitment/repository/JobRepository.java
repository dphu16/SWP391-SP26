package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {

    List<Job> findByEmployee_EmployeeId(UUID employeeId);

    List<Job> findByStatus(String status);

}
