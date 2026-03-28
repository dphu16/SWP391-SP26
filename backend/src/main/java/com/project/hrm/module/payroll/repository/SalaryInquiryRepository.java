package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.SalaryInquiry;
import com.project.hrm.module.payroll.enums.SalaryInquiryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SalaryInquiryRepository extends JpaRepository<SalaryInquiry, UUID> {

    List<SalaryInquiry> findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    List<SalaryInquiry> findAllByStatusOrderByCreatedAtAsc(SalaryInquiryStatus status);
}
