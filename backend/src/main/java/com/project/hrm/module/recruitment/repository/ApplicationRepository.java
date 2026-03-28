package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    boolean existsByCandidateIdAndJobId(UUID id, UUID id1);

    Application findByCandidateIdAndJobId(UUID id, UUID id1);

    boolean existsByCandidate_Id(UUID candidateId);

    //List<Application> findByJob_IdAndStatus(UUID jobId, ApplicationStatus status, Sort sort);

    long countByJob_IdAndStatus(UUID jobId, ApplicationStatus status);

    long countByJob_Id(UUID jobId);

    List<Application> findByJob_IdAndStatusIsNot(UUID jobId, ApplicationStatus status);

    @Query("""
                SELECT a FROM Application a
                WHERE a.job.id = :jobId 
                  AND a.status = :status
                ORDER BY 
                    CASE WHEN a.score IS NULL THEN 1 ELSE 0 END,
                    a.score DESC,
                    a.candidate.fullName ASC
            """)
    List<Application> findByJob_IdAndStatus(
            @Param("jobId") UUID jobId,
            @Param("status") ApplicationStatus status
    );

    @Query("""
                SELECT a FROM Application a
                WHERE a.status = ApplicationStatus.INTERVIEW
                AND a.job.id = :jobId
                AND NOT EXISTS (
                    SELECT i FROM Interview i WHERE i.app.id = a.id
                )
                ORDER BY a.createdAt ASC
            """)
    List<Application> findAppByJobAndWithoutInterview(
            @Param("jobId") UUID jobId
    );

    @Query("""
                SELECT a FROM Application a
                WHERE a.status = ApplicationStatus.INTERVIEW
                AND a.job.id = :jobId
                AND EXISTS (
                    SELECT i FROM Interview i WHERE i.app.id = a.id
                )
                ORDER BY a.createdAt ASC
            """)
    List<Application> findAppByJobAndHasInterview(
            @Param("jobId") UUID jobId
    );
}
