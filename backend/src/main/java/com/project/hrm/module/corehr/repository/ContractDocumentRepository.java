package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.ContractDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractDocumentRepository extends JpaRepository<ContractDocument, UUID> {

    /** Lookup theo contractId — dùng khi đã có Contract object */
    Optional<ContractDocument> findByContract_ContractId(UUID contractId);

    /** Lookup theo employeeId — dùng cho highlight-chat (chỉ có employeeId) */
    Optional<ContractDocument> findTopByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);
}
