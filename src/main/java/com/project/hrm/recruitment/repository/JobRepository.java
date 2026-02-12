package com.project.hrm.recruitment.repository;

import com.project.hrm.recruitment.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {


}
