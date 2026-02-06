package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.Interview;
import com.project.hrm.recruitment.enums.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    List<Interview> findByStatus(InterviewStatus status);

    List<Interview> findByInterviewer_Id(UUID employeeId);

    List<Interview> findByApp_Id(UUID appId);
}
