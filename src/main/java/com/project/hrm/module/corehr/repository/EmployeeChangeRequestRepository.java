package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.EmployeeChangeRequest;
import com.project.hrm.module.corehr.enums.ChangeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EmployeeChangeRequestRepository extends JpaRepository<EmployeeChangeRequest, UUID> {

    boolean existsByEmployee_EmployeeIdAndStatus(UUID employeeId, ChangeRequestStatus status);
}
