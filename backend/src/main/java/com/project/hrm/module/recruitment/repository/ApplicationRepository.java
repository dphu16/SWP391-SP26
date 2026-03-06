package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    boolean existsByCandidateIdAndJobId(UUID id, UUID id1);
    Application findByCandidateIdAndJobId(UUID id, UUID id1);
    List<Application> findByJob_Id(UUID id);
}
