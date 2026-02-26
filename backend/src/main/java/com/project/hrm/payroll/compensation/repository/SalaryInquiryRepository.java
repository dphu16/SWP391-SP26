package com.project.hrm.payroll.compensation.repository;

import com.project.hrm.payroll.common.enums.InquiryStatus;
import com.project.hrm.payroll.compensation.entity.SalaryInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SalaryInquiryRepository extends JpaRepository<SalaryInquiry, UUID> {

    List<SalaryInquiry> findByEmployeeEmployeeId(UUID employeeId);

    List<SalaryInquiry> findByStatus(InquiryStatus status);
}
