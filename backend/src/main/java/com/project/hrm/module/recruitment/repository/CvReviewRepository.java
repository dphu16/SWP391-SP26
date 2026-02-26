package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.CvReview;
import com.project.hrm.module.recruitment.enums.ResultStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CvReviewRepository extends JpaRepository<CvReview, UUID> {

}
