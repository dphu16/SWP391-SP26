package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.recruitment.entity.Interview;
import com.project.hrm.module.recruitment.enums.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {
    Interview findByApp_Id(UUID id);
    List<Interview> findAllByApp_IdIn(List<UUID> ids);
    List<Interview> findByInterviewer_EmployeeIdAndStatus(UUID id, InterviewStatus status);
}
