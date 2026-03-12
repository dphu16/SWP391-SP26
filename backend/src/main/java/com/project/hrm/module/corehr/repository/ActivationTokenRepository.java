package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.EmployeeActivationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ActivationTokenRepository extends JpaRepository<EmployeeActivationToken, UUID> {

    Optional<EmployeeActivationToken> findByTokenAndUsedFalse(String token);

    Optional<EmployeeActivationToken> findByEmployee_EmployeeIdAndUsedFalse(UUID employeeId);
}
