package com.project.hrm.module.recruitment.repository;

import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.recruitment.entity.Interview;
import com.project.hrm.module.recruitment.enums.InterviewStatus;
import org.springframework.data.domain.Example;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {
    Interview findByApp_Id(UUID id);

    List<Interview> findAllByApp_IdIn(List<UUID> ids);

    List<Interview> findByInterviewer_EmployeeIdAndStatusOrderByScheduleTime(UUID id, InterviewStatus status);

    boolean existsByApp_IdAndInterviewer_User_Roles_Name(UUID appId, EmployeeRole role);

    boolean existsByApp_IdAndApp_ScoreIsNull(UUID appId);

    List<Interview> findAllByApp_Id(UUID appId);

    void deleteAllByApp_Id(UUID appId);
}
