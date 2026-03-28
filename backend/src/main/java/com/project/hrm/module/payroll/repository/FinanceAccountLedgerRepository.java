package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.FinanceAccountLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FinanceAccountLedgerRepository extends JpaRepository<FinanceAccountLedger, UUID> {

    List<FinanceAccountLedger> findAllByAccount_AccountIdOrderByCreatedAtDesc(UUID accountId);

    /** Lấy dòng ledger cuối cùng để lấy balance_after làm balance hiện tại */
    @Query("""
        SELECT l FROM FinanceAccountLedger l
        WHERE l.account.accountId = :accountId
        ORDER BY l.createdAt DESC
        LIMIT 1
    """)
    Optional<FinanceAccountLedger> findLatestByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM FinanceAccountLedger l WHERE l.account.accountId = :accountId")
    BigDecimal calculateCurrentBalance(@Param("accountId") UUID accountId);
}
