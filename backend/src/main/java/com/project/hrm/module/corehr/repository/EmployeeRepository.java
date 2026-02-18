package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    @Override
    Optional<Employee> findById(UUID uuid);

    /**
     * Lấy danh sách nhân viên kèm theo thông tin user, position, department
     * trong một query duy nhất (tránh N+1).
     *
     * @param pageable thông tin phân trang và sắp xếp
     * @return trang nhân viên với các quan hệ đã được fetch sẵn
     */
    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query("SELECT e FROM Employee e")
    Page<Employee> findAllWithDetails(Pageable pageable);

    @EntityGraph(attributePaths = { "user", "position", "department" })
    @Query("SELECT e FROM Employee e WHERE e.employeeId = :id")
    Optional<Employee> findByIdWithDetails(UUID id);
}
