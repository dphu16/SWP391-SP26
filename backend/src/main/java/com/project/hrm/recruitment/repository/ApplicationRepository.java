package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.Application;
import com.project.hrm.recruitment.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    List<Application> findByStatus(ApplicationStatus status);

    List<Application> findByReq_Id(UUID reqId);

    List<Application> findByCandidate_Id(UUID candidateId);

    Optional<Application> findByReq_IdAndCandidate_Id(UUID reqId, UUID candidateId);
}
