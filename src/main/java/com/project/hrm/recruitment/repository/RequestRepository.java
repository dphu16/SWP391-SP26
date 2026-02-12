package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.dto.request.CreateAppRequest;
import com.project.hrm.recruitment.dto.request.CreateReqRequest;
import com.project.hrm.recruitment.entity.JobRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RequestRepository extends JpaRepository<JobRequest, UUID> {

}
