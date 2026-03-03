package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.enums.BatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollBatchRepository extends JpaRepository<PayrollBatch, UUID> {

    // Tìm batch theo tháng (để kiểm tra xem tháng này đã tạo batch chưa)
    Optional<PayrollBatch> findByPeriod(LocalDate period);

    // Kiểm tra nhanh xem tháng này đã có batch nào chưa
    boolean existsByPeriod(LocalDate period);

    // Lấy danh sách các batch theo trạng thái (Ví dụ: Lấy các batch đang DRAFT để
    // xử lý)
    List<PayrollBatch> findByStatus(BatchStatus status);

    // Query tìm batch mới nhất
    @Query("SELECT b FROM PayrollBatch b ORDER BY b.period DESC LIMIT 1")
    Optional<PayrollBatch> findLatestBatch();
}
