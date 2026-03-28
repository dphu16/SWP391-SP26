package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.CvReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface CvReviewRepository extends JpaRepository<CvReview, UUID> {
    CvReview findByApp_Id(UUID id);
    boolean existsByApp_Id(UUID appId);

    @Modifying
    @Query("DELETE FROM CvReview c WHERE c.app.id = :appId")
    void deleteByApp_Id(@Param("appId") UUID appId);
}
