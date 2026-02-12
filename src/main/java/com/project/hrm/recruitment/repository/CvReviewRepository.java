package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.CvReview;
import com.project.hrm.recruitment.enums.ResultStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CvReviewRepository extends JpaRepository<CvReview, UUID> {

}
