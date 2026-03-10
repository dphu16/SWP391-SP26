package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.SalaryInquiryResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SalaryInquiryResponseRepository extends JpaRepository<SalaryInquiryResponse, UUID> {

    // Hàm dùng để kiểm tra xem thắc mắc này đã có người trả lời chưa
    boolean existsByInquiryId(UUID inquiryId);
}
