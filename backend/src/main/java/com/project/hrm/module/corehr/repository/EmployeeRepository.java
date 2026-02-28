package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByUser(User user);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query("SELECT e FROM Employee e WHERE e.user.username = :username")
    Optional<Employee> findByUser_Username(String username);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query(value = "SELECT e FROM Employee e ORDER BY e.fullName ASC", countQuery = "SELECT COUNT(e) FROM Employee e")
    Page<Employee> findAllWithDetails(Pageable pageable);

    @EntityGraph(attributePaths = { "user", "position", "position.department" })
    List<Employee> findByPosition_Department_DeptId(UUID deptId);
    @Override
    Optional<Employee> findById(UUID uuid);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query("SELECT e FROM Employee e WHERE e.employeeId = :id")
    Optional<Employee> findByIdWithDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    List<Employee> findByEmpStatusIn(List<EmployeeStatus> statuses);

    @Query("SELECT e FROM Employee e LEFT JOIN e.personal p " +
            "WHERE LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(p.phone) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Employee> searchEmployeesByKeyword(@Param("search") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = { "user", "position", "position.department" })
    List<Employee> findByManager_EmployeeId(UUID managerId);

}
