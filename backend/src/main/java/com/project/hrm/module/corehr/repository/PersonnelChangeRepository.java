package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.PersonnelChange;
import com.project.hrm.module.corehr.enums.PersonnelChangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PersonnelChangeRepository extends JpaRepository<PersonnelChange, UUID> {

    List<PersonnelChange> findByEmployee_EmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    List<PersonnelChange> findByStatusOrderByCreatedAtDesc(PersonnelChangeStatus status);

    List<PersonnelChange> findByStatusInOrderByCreatedAtDesc(List<PersonnelChangeStatus> statuses);
    List<PersonnelChange> findByRequestedByOrderByCreatedAtDesc(UUID requestedBy);
}
