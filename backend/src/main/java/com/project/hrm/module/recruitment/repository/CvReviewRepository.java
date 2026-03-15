package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.CvReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CvReviewRepository extends JpaRepository<CvReview, UUID> {
    CvReview findByApp_Id(UUID id);
    boolean existsByApp_Id(UUID appId);

    void deleteByApp_Id(UUID appId);
}
