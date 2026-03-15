package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.JobDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JobDetailRepository extends JpaRepository<JobDetail, UUID> {
}
