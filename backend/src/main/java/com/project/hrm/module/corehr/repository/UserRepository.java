package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Tìm user theo username — dùng cho đăng nhập.
     * Spring Data JPA tự generate SQL từ tên method.
     */
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
