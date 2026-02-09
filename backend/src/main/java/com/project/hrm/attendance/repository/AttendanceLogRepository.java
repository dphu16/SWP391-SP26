package com.project.hrm.attendance.repository;

import com.project.hrm.attendance.entity.AttendanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, UUID> {

    List<AttendanceLog> findByEmployeeIdAndDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate);

    boolean existsByEmployeeIdAndDate(UUID employeeId, LocalDate date);
}