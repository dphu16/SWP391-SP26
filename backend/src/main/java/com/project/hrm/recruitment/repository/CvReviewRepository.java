package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.CvReview;
import com.project.hrm.recruitment.enums.ReviewResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CvReviewRepository extends JpaRepository<CvReview, UUID> {

    List<CvReview> findByApp_Id(UUID appId);

    List<CvReview> findByResult(ReviewResult result);
}
