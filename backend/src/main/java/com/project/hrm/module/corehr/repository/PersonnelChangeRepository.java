package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.PersonnelChange;
import com.project.hrm.module.corehr.enums.PersonnelChangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PersonnelChangeRepository extends JpaRepository<PersonnelChange, UUID> {

    List<PersonnelChange> findByEmployee_EmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    List<PersonnelChange> findByStatusOrderByCreatedAtDesc(PersonnelChangeStatus status);

    @Query("SELECT pc FROM PersonnelChange pc " +
           "LEFT JOIN FETCH pc.employee e " +
           "LEFT JOIN FETCH e.department " +
           "WHERE pc.status IN :statuses " +
           "ORDER BY pc.createdAt DESC")
    List<PersonnelChange> findByStatusInOrderByCreatedAtDesc(@Param("statuses") List<PersonnelChangeStatus> statuses);

    List<PersonnelChange> findByRequestedByOrderByCreatedAtDesc(UUID requestedBy);
}
