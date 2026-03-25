package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayslipRepository extends JpaRepository<Payslip, UUID> {

    List<Payslip> findAllByBatch_BatchId(UUID batchId);

    void deleteAllByBatch_BatchId(UUID batchId);

    List<Payslip> findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    // Thêm method này để closePeriod hoạt động
    boolean existsByBatch_Period_PeriodIdAndStatusNot(UUID periodId, PayslipStatus status);

    Optional<Payslip> findByEmployee_EmployeeIdAndBatch_BatchId(UUID employeeId, UUID batchId);

    /** Lấy phiếu lương mới nhất của nhân viên dựa theo start_date của kỳ lương */
    Optional<Payslip> findFirstByEmployee_EmployeeIdOrderByPeriod_StartDateDesc(UUID employeeId);

    /** Tổng net salary của tất cả payslip CONFIRMED trong một batch — dùng để tạo payment request */
    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payslip p WHERE p.batch.batchId = :batchId AND p.status = 'CONFIRMED'")
    BigDecimal sumNetSalaryByBatchId(@Param("batchId") UUID batchId);

    /** Tổng tiền thuế TNCN (PIT) của các payslip CONFIRMED trong batch */
    @Query("SELECT COALESCE(SUM(p.taxAmount), 0) FROM Payslip p WHERE p.batch.batchId = :batchId AND p.status = 'CONFIRMED'")
    BigDecimal sumTaxAmountByBatchId(@Param("batchId") UUID batchId);

    /** Tổng tiền bảo hiểm (Social Ins) của các payslip CONFIRMED trong batch */
    @Query("SELECT COALESCE(SUM(p.insuranceAmount), 0) FROM Payslip p WHERE p.batch.batchId = :batchId AND p.status = 'CONFIRMED'")
    BigDecimal sumInsuranceAmountByBatchId(@Param("batchId") UUID batchId);
}
