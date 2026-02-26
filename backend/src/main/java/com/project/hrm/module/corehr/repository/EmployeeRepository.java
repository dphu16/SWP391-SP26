package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

        Optional<Employee> findByUser(User user);

        @Override
        Optional<Employee> findById(UUID uuid);

        @EntityGraph(attributePaths = { "user", "position", "department" })
        @Query(value = "SELECT e FROM Employee e ORDER BY e.fullName ASC", countQuery = "SELECT COUNT(e) FROM Employee e")
        Page<Employee> findAllWithDetails(Pageable pageable);

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

<<<<<<< HEAD
    @Query("SELECT p FROM Personal p WHERE LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.employee.email) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.phone) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Employee> searchEmployeesByKeyword(@Param("search") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.status = ACTIVE")
    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE'")
    List<Employee> findAllActive();

    Optional<Employee> findByUserId(UUID userId);

    Page<Employee> findByFullNameContainingIgnoreCase(String keyword, Pageable pageable);

    @Query("""
    SELECT e FROM Employee e
    WHERE e.empStatus IN ('OFFICIAL','PROBATION')
""")
    List<Employee> findActiveEmployeesForPayroll();
=======
        @Query("SELECT e FROM Employee e WHERE e.user.status = com.project.hrm.module.corehr.enums.UserStatus.ACTIVE")
        List<Employee> findAllActive();
>>>>>>> df05727451ef27a28699bbdee957247d77b96b1d
}
