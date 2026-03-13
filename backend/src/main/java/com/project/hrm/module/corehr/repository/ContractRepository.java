package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {

    List<Contract> findByEmployee_EmployeeIdOrderByStartDateDesc(UUID employeeId);

    @Query("SELECT c FROM Contract c WHERE c.endDate IS NOT NULL " +
            "AND c.endDate BETWEEN :from AND :to " +
            "AND c.status = 'ACTIVE'")
    List<Contract> findExpiringContracts(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
