package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    boolean existsByCandidateIdAndJobId(UUID id, UUID id1);
    Application findByCandidateIdAndJobId(UUID id, UUID id1);
    boolean existsByCandidate_Id(UUID candidateId);
    List<Application> findByJob_IdAndStatus(UUID jobId, ApplicationStatus status, Sort sort);
    long countByJob_IdAndStatus(UUID jobId, ApplicationStatus status);
    List<Application> findByJob_IdAndStatusIsNot(UUID jobId, ApplicationStatus status);
}
