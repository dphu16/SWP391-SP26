package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Request;
import com.project.hrm.module.corehr.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmployeeChangeRequestRepository extends JpaRepository<Request, UUID> {

    boolean existsByEmployee_EmployeeIdAndStatus(UUID employeeId, RequestStatus status);

    List<Request> findByEmployee_EmployeeIdOrderByCreatedAtDesc(UUID employeeId);
}
