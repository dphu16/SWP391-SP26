package com.project.hrm.payroll.compensation.repository;

import com.project.hrm.payroll.compensation.entity.PayslipDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayslipDetailRepository extends JpaRepository<PayslipDetail, UUID> {

    List<PayslipDetail> findByPayslipPayslipId(UUID payslipId);
}
