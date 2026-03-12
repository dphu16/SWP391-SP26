package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Offboarding;
import com.project.hrm.module.corehr.enums.OffboardingStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OffboardingRepository extends JpaRepository<Offboarding, UUID> {

    boolean existsByEmployee_EmployeeIdAndStatusIn(UUID employeeId, List<OffboardingStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Offboarding o WHERE o.employee.employeeId = :employeeId AND o.expectedLastDay >= :start AND o.expectedLastDay <= :end AND o.status = 'APPROVED'")
    java.util.Optional<Offboarding> findApprovedOffboardingInPeriod(
            @org.springframework.data.repository.query.Param("employeeId") UUID employeeId,
            @org.springframework.data.repository.query.Param("start") java.time.LocalDate start,
            @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.position", "employee.personal"})
    List<Offboarding> findByStatusIn(List<OffboardingStatus> statuses);

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.position", "employee.personal"})
    List<Offboarding> findByEmployee_EmployeeId(UUID employeeId);

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.position", "employee.personal"})
    Optional<Offboarding> findByOffboardingId(UUID offboardingId);

    /** Tìm các request đã HR_CONFIRMED và officialLastDay <= today → để scheduled job xử lý */
    List<Offboarding> findByStatusAndOfficialLastDayLessThanEqual(
            OffboardingStatus status, LocalDate date);

    /** Tìm requests theo employee và trạng thái đang active (PENDING hoặc MANAGER_APPROVED hoặc HR_CONFIRMED) */
    Optional<Offboarding> findByEmployee_EmployeeIdAndStatusIn(UUID employeeId, List<OffboardingStatus> statuses);
}
