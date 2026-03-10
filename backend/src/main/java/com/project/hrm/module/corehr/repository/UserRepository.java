package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    List<User> findByRoles_Name(EmployeeRole name);
}
