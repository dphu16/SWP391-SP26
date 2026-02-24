package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByUser(com.project.hrm.module.corehr.entity.User user);

    @Override
    Optional<Employee> findById(UUID uuid);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query(value = "SELECT e FROM Employee e", countQuery = "SELECT COUNT(e) FROM Employee e")
    Page<Employee> findAllWithDetails(Pageable pageable);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query("SELECT e FROM Employee e WHERE e.employeeId = :id")
    Optional<Employee> findByIdWithDetails(UUID id);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    List<Employee> findByStatusPosIn(List<EmployeeStatus> statuses);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query(value = "SELECT e FROM Employee e WHERE e.statusPos IN :statuses", countQuery = "SELECT COUNT(e) FROM Employee e WHERE e.statusPos IN :statuses")
    Page<Employee> findByStatusPosInPageable(List<EmployeeStatus> statuses, Pageable pageable);

    List<Employee> findAllActive();
}
