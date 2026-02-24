package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.Application;
import com.project.hrm.recruitment.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

}
