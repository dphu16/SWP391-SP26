package com.project.hrm.module.payroll.repository;


import com.project.hrm.module.payroll.entity.PayrollDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollDetailRepository extends JpaRepository<PayrollDetail, UUID> {

    // 1. Tìm chi tiết lương của 1 nhân viên trong 1 batch cụ thể
    Optional<PayrollDetail> findByPayrollBatch_BatchIdAndEmployee_EmployeeId(UUID batchId, UUID employeeId);

    // 2. Lấy toàn bộ danh sách chi tiết của 1 batch (Dùng để xuất báo cáo hoặc hiển thị bảng lương tổng)
    List<PayrollDetail> findByPayrollBatch_BatchId(UUID batchId);

    // 3. XÓA dữ liệu cũ của 1 batch (Dùng khi tính lại lương - Recalculate)
    // Sử dụng @Modifying và Native Query hoặc JPQL để delete nhanh hơn
    @Modifying
    @Query("DELETE FROM PayrollDetail pd WHERE pd.payrollBatch.batchId = :batchId")
    void deleteByBatchId(@Param("batchId") UUID batchId);

    // 4. Kiểm tra xem nhân viên đã có trong bảng tính lương này chưa
    boolean existsByPayrollBatch_BatchIdAndEmployee_EmployeeId(UUID batchId, UUID employeeId);
}
