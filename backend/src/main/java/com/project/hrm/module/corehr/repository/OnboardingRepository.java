package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OnboardingRepository extends JpaRepository<Application, UUID> {
    Page<Application> findByStatus(ApplicationStatus status, Pageable pageable);
}
