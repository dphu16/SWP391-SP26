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
}
