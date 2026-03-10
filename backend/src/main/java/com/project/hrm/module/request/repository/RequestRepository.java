package com.project.hrm.module.request.repository;

import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.enums.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RequestRepository extends JpaRepository<Request, UUID> {
    // Employee xem đơn của mình (Mới nhất lên đầu)
    List<Request> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    // Manager xem tất cả đơn (Mới nhất lên đầu)
    List<Request> findAllByOrderByCreatedAtDesc();

    boolean existsByEmployeeIdAndStatus(UUID employeeId, RequestStatus status);

    Optional<Request> findTopByEmployeeIdAndRequestTypeAndStatusOrderByCreatedAtDesc(
            UUID employeeId, RequestType requestType, RequestStatus status);
}