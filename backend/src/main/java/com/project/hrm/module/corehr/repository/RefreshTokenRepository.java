package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.RefreshToken;
import com.project.hrm.module.corehr.entity.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Transactional
    void deleteByUser(User user);

    Optional<RefreshToken> findByUser(User user);
}
