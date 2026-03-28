package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PayslipDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PayslipDetailRepository extends JpaRepository<PayslipDetail, UUID> {
    List<PayslipDetail> findAllByPayslip_PayslipId(UUID payslipId);
    void deleteAllByPayslip_PayslipId(UUID payslipId);
}
