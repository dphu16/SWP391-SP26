package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Role;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByName(EmployeeRole name);

    boolean existsByName(EmployeeRole name);
}
