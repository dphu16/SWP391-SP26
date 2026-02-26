package com.project.hrm.module.payroll.repository;



import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {

    // 1. Lấy danh sách phiếu lương của nhân viên (Chỉ lấy trạng thái cho phép)
    Page<Payslip> findByEmployee_EmployeeIdAndStatusIn(
            UUID employeeId,
            Collection<PayslipStatus> statuses,
            Pageable pageable
    );

    // 2. Lấy chi tiết 1 phiếu lương
    // Dùng JOIN FETCH để lấy luôn thông tin Period và Details trong 1 câu Query
    @Query("SELECT p FROM Payslip p " +
            "JOIN FETCH p.payrollPeriod " +
            "LEFT JOIN FETCH p.details " +
            "WHERE p.payslipId = :payslipId " +
            "AND p.employee.employeeId = :employeeId")
    Optional<Payslip> findByIdAndEmployeeId(
            @Param("payslipId") UUID payslipId,
            @Param("employeeId") UUID employeeId
    );
}
