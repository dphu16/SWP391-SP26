package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.JobRequest;
import com.project.hrm.recruitment.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobRequestRepository extends JpaRepository<JobRequest, UUID> {

    List<JobRequest> findByDept_DeptId(UUID id);

}
