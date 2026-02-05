package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
}
