package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Offboarding;
import com.project.hrm.module.corehr.enums.OffboardingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OffboardingRepository extends JpaRepository<Offboarding, UUID> {

    /**
     * Kiểm tra xem employee có offboarding request nào đang ở trạng thái
     * nằm trong danh sách statuses hay không.
     * <p>
     * Dùng để đảm bảo 1 employee chỉ có tối đa 1 request chưa hoàn tất
     * (PENDING hoặc APPROVED).
     */
    boolean existsByEmployee_EmployeeIdAndStatusIn(UUID employeeId, List<OffboardingStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Offboarding o WHERE o.employee.employeeId = :employeeId AND o.expectedLastDay >= :start AND o.expectedLastDay <= :end AND o.status = 'APPROVED'")
    java.util.Optional<Offboarding> findApprovedOffboardingInPeriod(
            @org.springframework.data.repository.query.Param("employeeId") UUID employeeId,
            @org.springframework.data.repository.query.Param("start") java.time.LocalDate start,
            @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);
}
