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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {

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

        @EntityGraph(attributePaths = { "user", "user.roles", "position", "department", "personal", "contract" })
        @Query("SELECT e FROM Employee e WHERE e.employeeId = :id")
        Optional<Employee> findByIdWithDetails(@Param("id") UUID id);

        @EntityGraph(attributePaths = { "user", "position", "department", "personal" })
        List<Employee> findByStatusIn(List<EmployeeStatus> statuses);

        @Query("SELECT e FROM Employee e LEFT JOIN e.personal p " +
                        "WHERE LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(p.phone) LIKE LOWER(CONCAT('%', :search, '%'))")
        Page<Employee> searchEmployeesByKeyword(@Param("search") String keyword, Pageable pageable);

        @EntityGraph(attributePaths = { "user", "position", "department", "personal" })
        List<Employee> findByEmpStatusNot(ProgressStatus status);

        Optional<Employee> findByUser(User user);

        @Query("SELECT e FROM Employee e WHERE e.user.status = com.project.hrm.module.corehr.enums.UserStatus.ACTIVE")
        List<Employee> findAllActive();

        @EntityGraph(attributePaths = { "user", "user.roles", "position", "department", "personal" })
        List<Employee> findByManager_EmployeeId(UUID managerId);

    // Sửa lại để trả về List<Employee> và truy vấn thông qua quan hệ với User
    @Query("SELECT e FROM Employee e WHERE e.user.status = 'ACTIVE'")
    List<Employee> findActiveEmployeesForPayroll();

    @EntityGraph(attributePaths = { "user", "position", "department" })
    List<Employee> findByDepartment_DeptId(UUID deptId);


}
