package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.SystemChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SystemChangeLogRepository extends JpaRepository<SystemChangeLog, UUID> {
}
