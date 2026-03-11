package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.FieldCooldown;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FieldCooldownRepository extends JpaRepository<FieldCooldown, UUID> {

    List<FieldCooldown> findByEmployee_EmployeeId(UUID employeeId);

    Optional<FieldCooldown> findByEmployee_EmployeeIdAndFieldName(UUID employeeId, String fieldName);

    boolean existsByEmployee_EmployeeIdAndFieldNameAndCooldownUntilAfter(
            UUID employeeId, String fieldName, LocalDateTime now);
}
