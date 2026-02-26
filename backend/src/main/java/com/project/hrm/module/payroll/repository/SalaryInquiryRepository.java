package com.project.hrm.module.payroll.repository;


import com.project.hrm.module.payroll.entity.SalaryInquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SalaryInquiryRepository extends JpaRepository<SalaryInquiry, UUID> {

    // Lấy danh sách thắc mắc của riêng nhân viên đó, sắp xếp theo ngày tạo mới nhất
    Page<SalaryInquiry> findByEmployee_EmployeeIdOrderByCreatedAtDesc(
            UUID employeeId,
            Pageable pageable
    );
}
