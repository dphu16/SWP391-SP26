package com.project.hrm.module.attendance.repository;

import com.project.hrm.module.attendance.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, UUID> {

    WorkSchedule findByEmployeeIdAndDate(UUID employeeId, LocalDate date);

    List<WorkSchedule> findByEmployeeId(UUID employeeId);
    // Thêm hàm này vào dưới cùng
    List<WorkSchedule> findByEmployeeIdAndDateBetweenOrderByDateAsc(UUID employeeId, LocalDate startDate, LocalDate endDate);
}