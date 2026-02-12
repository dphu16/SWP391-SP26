package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.JobRequisition;
import com.project.hrm.recruitment.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobRequisitionRepository extends JpaRepository<JobRequisition, UUID> {

    List<JobRequisition> findByStatus(JobStatus status);

    List<JobRequisition> findByDepartment_Id(UUID deptId);

    List<JobRequisition> findByPosition_Id(UUID positionId);
}
