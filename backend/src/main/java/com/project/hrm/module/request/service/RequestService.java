package com.project.hrm.module.request.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.request.dto.RequestDTO;
import com.project.hrm.module.request.dto.RequestResponseDTO;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestRepository requestRepo;
    private final EmployeeRepository employeeRepo;

    // --- 1. TẠO YÊU CẦU MỚI (EMPLOYEE) ---
    @Transactional
    public Request createRequest(RequestDTO dto) {
        Request req = new Request();
        req.setEmployeeId(dto.getEmployeeId());
        req.setRequestType(dto.getRequestType());
        req.setReason(dto.getReason());
        req.setStartDate(dto.getStartDate());
        req.setEndDate(dto.getEndDate());
        return requestRepo.save(req);
    }

    // --- 2. XEM YÊU CẦU CÁ NHÂN (EMPLOYEE) ---
    @Transactional(readOnly = true)
    public List<Request> getMyRequests(UUID empId) {
        return requestRepo.findByEmployeeIdOrderByCreatedAtDesc(empId);
    }

    // --- 3. XEM TẤT CẢ KÈM TÊN NHÂN VIÊN & PHÒNG BAN (MANAGER) ---
    @Transactional(readOnly = true)
    public List<RequestResponseDTO> getAllRequestsForReview() {
        return requestRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(req -> {
                    // Dùng repo của Anh để tìm nhân viên
                    Employee emp = employeeRepo.findById(req.getEmployeeId()).orElse(null);

                    return RequestResponseDTO.builder()
                            .requestId(req.getRequestId())
                            .employeeName(emp != null ? emp.getFullName() : "Unknown")
                            // Lấy deptName từ quan hệ department trong Entity Employee của Anh
                            .deptName(emp != null && emp.getDepartment() != null
                                    ? emp.getDepartment().getDeptName() : "N/A")
                            .requestType(req.getRequestType())
                            .status(req.getStatus())
                            .reason(req.getReason())
                            .startDate(req.getStartDate())
                            .endDate(req.getEndDate())
                            .createdAt(req.getCreatedAt())
                            .build();
                }).collect(Collectors.toList());
    }

    // --- 4. DUYỆT YÊU CẦU (MANAGER) ---
    @Transactional
    public Request approveRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu ID: " + requestId));

        req.setStatus(RequestStatus.APPROVED);
        if (dto != null && dto.getManagerComment() != null) {
            req.setManagerComment(dto.getManagerComment());
        }
        return requestRepo.save(req);
    }

    // --- 5. TỪ CHỐI YÊU CẦU (MANAGER) ---
    @Transactional
    public Request rejectRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu ID: " + requestId));

        req.setStatus(RequestStatus.REJECTED);
        if (dto != null && dto.getManagerComment() != null) {
            req.setManagerComment(dto.getManagerComment());
        }
        return requestRepo.save(req);
    }

    // --- 6. CẬP NHẬT YÊU CẦU (Hàm cũ của Anh) ---
    @Transactional
    public Request updateRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu ID: " + requestId));

        // Chỉ cho phép sửa khi đơn đang chờ duyệt
        if (req.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể cập nhật đơn đang ở trạng thái PENDING.");
        }

        req.setRequestType(dto.getRequestType());
        req.setReason(dto.getReason());
        req.setStartDate(dto.getStartDate());
        req.setEndDate(dto.getEndDate());

        return requestRepo.save(req);
    }

    // --- 7. XÓA YÊU CẦU (Hàm cũ của Anh) ---
    @Transactional
    public void deleteRequest(UUID requestId) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu ID: " + requestId));

        // Chỉ cho phép xóa khi đơn đang chờ duyệt
        if (req.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể xóa đơn đang ở trạng thái PENDING.");
        }

        requestRepo.delete(req);
    }

    // --- 8. XEM ĐƠN CÁ NHÂN FORMATTED (Hàm cũ của Anh) ---
    @Transactional(readOnly = true)
    public List<Request> getMyRequestsFormatted(UUID empId) {
        return requestRepo.findByEmployeeIdOrderByCreatedAtDesc(empId);
    }
}