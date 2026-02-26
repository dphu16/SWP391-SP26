package com.project.hrm.module.attendance.repository;

import com.project.hrm.module.attendance.entity.AttendanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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

    @Query("""
        SELECT COALESCE(SUM(a.workingHours),0)
        FROM AttendanceLog a
        WHERE a.employeeId = :employeeId
        AND a.date BETWEEN :start AND :end
        AND a.status <> 'ABSENT'
    """)
    BigDecimal sumWorkingHours(
            @Param("employeeId") UUID employeeId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @Query("""
        SELECT COALESCE(SUM(a.otHours),0)
        FROM AttendanceLog a
        WHERE a.employeeId = :employeeId
        AND a.date BETWEEN :start AND :end
    """)
    BigDecimal sumOtHours(
            @Param("employeeId") UUID employeeId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @Query("""
        SELECT COUNT(a)
        FROM AttendanceLog a
        WHERE a.employeeId = :employeeId
        AND a.date BETWEEN :start AND :end
        AND a.status = 'ABSENT'
    """)
    BigDecimal countAbsentDays(
            @Param("employeeId") UUID employeeId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}