package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.User;
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

    Optional<Employee> findByUser(User user);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query("SELECT e FROM Employee e WHERE e.user.username = :username")
    Optional<Employee> findByUser_Username(String username);

    @Override
    Optional<Employee> findById(UUID uuid);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query(value = "SELECT e FROM Employee e LEFT JOIN e.personal p ORDER BY p.fullName ASC",
            countQuery = "SELECT COUNT(e) FROM Employee e")
    Page<Employee> findAllWithDetails(Pageable pageable);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query("SELECT e FROM Employee e WHERE e.employeeId = :id")
    Optional<Employee> findByIdWithDetails(UUID id);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    List<Employee> findByEmpStatusIn(List<EmployeeStatus> statuses);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query(value = "SELECT e FROM Employee e WHERE e.empStatus IN :statuses", countQuery = "SELECT COUNT(e) FROM Employee e WHERE e.empStatus IN :statuses")
    Page<Employee> findByEmpStatusInPageable(List<EmployeeStatus> statuses, Pageable pageable);
}
