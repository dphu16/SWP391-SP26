package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.JobRequest;
import com.project.hrm.module.recruitment.enums.RequestStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobRequestRepository extends JpaRepository<JobRequest, UUID> {

    List<JobRequest> findByDept_DeptNameAndStatus(
            String name,
            RequestStatus status,
            Sort sort
    );
    List<JobRequest> findByReportsTo_EmployeeIdAndStatus(
            UUID employeeId, RequestStatus status,
            Sort sort
    );
    List<JobRequest> findByStatusAndReportsToIsNull(RequestStatus status);

}
