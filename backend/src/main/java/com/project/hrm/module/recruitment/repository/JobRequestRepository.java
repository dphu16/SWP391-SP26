package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.JobRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobRequestRepository extends JpaRepository<JobRequest, UUID> {

    List<JobRequest> findByDept_DeptName(String name);

    List<JobRequest> findByReportsTo_EmployeeId(UUID reportsToEmployeeId);

}
