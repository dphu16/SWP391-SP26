package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.EmployeeBenefit;
import com.project.hrm.module.payroll.enums.EmployeeBenefitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeBenefitRepository extends JpaRepository<EmployeeBenefit, UUID> {
    
    List<EmployeeBenefit> findByEmployee_EmployeeIdAndStatus(UUID employeeId, EmployeeBenefitStatus status);

    @Query("SELECT eb FROM EmployeeBenefit eb WHERE eb.employee.employeeId = :employeeId " +
           "AND eb.status = 'ACTIVE' " +
           "AND eb.startDate <= :endDate " +
           "AND (eb.endDate IS NULL OR eb.endDate >= :startDate)")
    List<EmployeeBenefit> findActiveBenefitsForPeriod(
            @Param("employeeId") UUID employeeId, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
}
