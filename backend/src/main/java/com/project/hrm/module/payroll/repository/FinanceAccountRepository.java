package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.FinanceAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinanceAccountRepository extends JpaRepository<FinanceAccount, UUID> {
    List<FinanceAccount> findByStatus(String status);
}