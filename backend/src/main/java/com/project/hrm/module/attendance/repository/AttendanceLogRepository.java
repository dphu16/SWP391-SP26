package com.project.hrm.module.attendance.repository;

import com.project.hrm.module.attendance.entity.AttendanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, UUID> {

    // 1. Tìm bản ghi cụ thể của nhân viên trong ngày (Để Check-out)
    Optional<AttendanceLog> findByEmployeeIdAndDate(UUID employeeId, LocalDate date);

    // 2. Lấy lịch sử (Code cũ của bạn - Giữ nguyên)
    List<AttendanceLog> findByEmployeeIdAndDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate);

    // 3. Lấy toàn bộ lịch sử của 1 nhân viên (Sắp xếp mới nhất)
    List<AttendanceLog> findByEmployeeIdOrderByDateDesc(UUID employeeId);

    // 4. Lấy tất cả cho Manager (Sắp xếp mới nhất)
    List<AttendanceLog> findAllByOrderByDateDesc();
    // Thêm cái này vào trong interface AttendanceLogRepository
    @Query("SELECT a FROM AttendanceLog a WHERE a.employeeId = :employeeId " +
            "AND EXTRACT(MONTH FROM a.date) = :month " +
            "AND EXTRACT(YEAR FROM a.date) = :year")
    List<AttendanceLog> findLogsByMonthAndYear(@Param("employeeId") UUID employeeId,
                                               @Param("month") int month,
                                               @Param("year") int year);
}