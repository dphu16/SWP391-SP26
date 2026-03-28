package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {

    @EntityGraph(attributePaths = { "user", "user.roles", "position", "department", "personal" })
    @Override
    Page<Employee> findAll(Specification<Employee> spec, Pageable pageable);

    @EntityGraph(attributePaths = { "user", "user.roles", "position", "department", "personal" })
    Optional<Employee> findByUser_Email(String email);

    @EntityGraph(attributePaths = { "user", "user.roles", "position", "department", "personal" })
    @Query(value = "SELECT e FROM Employee e ORDER BY e.fullName ASC", countQuery = "SELECT COUNT(e) FROM Employee e")
    Page<Employee> findAllWithDetails(Pageable pageable);

    @EntityGraph(attributePaths = { "user", "position", "position.department" })
    List<Employee> findByPosition_Department_DeptId(UUID deptId);

    @EntityGraph(attributePaths = { "user", "user.roles", "position", "department", "personal" })
    Optional<Employee> findByPersonal_Email(String email);

    @EntityGraph(attributePaths = { "user", "user.roles", "position", "department", "personal" })
    @Override
    Optional<Employee> findById(UUID uuid);

    @EntityGraph(attributePaths = { "user", "user.roles", "position", "department", "personal", "contract", "manager",
            "mentor", "manager.personal", "mentor.personal" })
    @Query("SELECT e FROM Employee e WHERE e.employeeId = :id")
    Optional<Employee> findByIdWithDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = { "user", "position", "department", "personal" })
    List<Employee> findByStatusIn(List<EmployeeStatus> statuses);

    @Query(value = """
            SELECT e.* FROM employees e
            LEFT JOIN personal_info p ON p.employee_id = e.employee_id
            WHERE unaccent(lower(e.full_name)) LIKE unaccent(lower(concat('%', :search, '%')))
            OR lower(e.employee_code) LIKE lower(concat('%', :search, '%'))
            OR lower(p.email) LIKE lower(concat('%', :search, '%'))
            OR lower(p.phone) LIKE lower(concat('%', :search, '%'))
            """, countQuery = """
            SELECT count(e.*) FROM employees e
            LEFT JOIN personal_info p ON p.employee_id = e.employee_id
            WHERE unaccent(lower(e.full_name)) LIKE unaccent(lower(concat('%', :search, '%')))
            OR lower(e.employee_code) LIKE lower(concat('%', :search, '%'))
            OR lower(p.email) LIKE lower(concat('%', :search, '%'))
            OR lower(p.phone) LIKE lower(concat('%', :search, '%'))
            """, nativeQuery = true)
    Page<Employee> searchEmployeesByKeyword(@Param("search") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = { "user", "position", "department", "personal" })
    List<Employee> findByEmpStatusNot(ProgressStatus status);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    List<Employee> findByDepartment_DeptId(UUID deptId);

}
