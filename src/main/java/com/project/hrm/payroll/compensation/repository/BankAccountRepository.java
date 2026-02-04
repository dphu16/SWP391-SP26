package com.project.hrm.payroll.compensation.repository;
import com.project.hrm.payroll.compensation.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {
    Optional<BankAccount> findByEmployeeIdAndIsPrimaryTrue(UUID employeeId);
}

