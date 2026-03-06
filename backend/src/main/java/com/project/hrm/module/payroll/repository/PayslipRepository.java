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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {

        /**
         * Lấy danh sách phiếu lương + fetch PayrollPeriod luôn để tránh
         * LazyInitializationException.
         * ORDER BY year DESC, month DESC để sort theo kỳ mới nhất.
         * Dùng countQuery riêng vì JOIN FETCH + Pageable yêu cầu countQuery.
         */
        @Query(value = "SELECT p FROM Payslip p " +
                        "JOIN FETCH p.payrollPeriod pp " +
                        "WHERE p.employee.employeeId = :employeeId " +
                        "AND p.status IN :statuses " +
                        "ORDER BY pp.year DESC, pp.month DESC", countQuery = "SELECT COUNT(p) FROM Payslip p " +
                                        "WHERE p.employee.employeeId = :employeeId " +
                                        "AND p.status IN :statuses")
        Page<Payslip> findPayslipsWithPeriod(
                        @Param("employeeId") UUID employeeId,
                        @Param("statuses") Collection<PayslipStatus> statuses,
                        Pageable pageable);

        /**
         * Lấy chi tiết 1 phiếu lương.
         * Dùng JOIN FETCH để lấy luôn thông tin Period và Details trong 1 câu Query.
         */
        @Query("SELECT p FROM Payslip p " +
                        "JOIN FETCH p.payrollPeriod " +
                        "LEFT JOIN FETCH p.details " +
                        "WHERE p.payslipId = :payslipId " +
                        "AND p.employee.employeeId = :employeeId")
        Optional<Payslip> findByIdAndEmployeeId(
                        @Param("payslipId") UUID payslipId,
                        @Param("employeeId") UUID employeeId);

        // Xoá Payslip theo Period khi tính lại batch
        void deleteByPayrollPeriod_PeriodId(UUID periodId);

        List<Payslip> findByEmployee_EmployeeIdAndPayrollPeriod_MonthAndPayrollPeriod_Year(
                        UUID employeeId, int month, int year);
}
