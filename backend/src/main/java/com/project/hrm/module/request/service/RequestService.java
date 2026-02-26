package com.project.hrm.module.request.service;

import com.project.hrm.module.request.dto.RequestDTO;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestRepository requestRepo;

    // --- 1. TẠO YÊU CẦU MỚI (Lưu thật vào DB) ---
    @Transactional
    public Request createRequest(RequestDTO dto) {
        Request req = new Request();
        req.setEmployeeId(dto.getEmployeeId());
        req.setRequestType(dto.getRequestType()); // Nhận Enum từ DTO
        req.setReason(dto.getReason());
        req.setStartDate(dto.getStartDate());
        req.setEndDate(dto.getEndDate());
        // Status mặc định PENDING được gán tự động tại Entity @PrePersist
        return requestRepo.save(req);
    }

    // --- 2. XEM YÊU CẦU CÁ NHÂN ---
    @Transactional(readOnly = true)
    public List<Request> getMyRequests(UUID empId) {
        return requestRepo.findByEmployeeIdOrderByCreatedAtDesc(empId);
    }

    // --- 3. XEM TẤT CẢ (CHO MANAGER) ---
    @Transactional(readOnly = true)
    public List<Request> getAllRequests() {
        return requestRepo.findAllByOrderByCreatedAtDesc();
    }

    // --- 4. DUYỆT YÊU CẦU ---
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

    // --- 5. TỪ CHỐI YÊU CẦU ---
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

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

    @Transactional(readOnly = true)
    public List<Request> getMyRequestsFormatted(UUID empId) {
        List<Request> requests = requestRepo.findByEmployeeIdOrderByCreatedAtDesc(empId);
        return requests;
    }

    // --- 6. CẬP NHẬT YÊU CẦU ---
    @Transactional
    public Request updateRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu ID: " + requestId));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể cập nhật đơn đang chờ duyệt (PENDING).");
        }

        req.setRequestType(dto.getRequestType());
        req.setReason(dto.getReason());
        req.setStartDate(dto.getStartDate());
        req.setEndDate(dto.getEndDate());

        return requestRepo.save(req);
    }

    // --- 7. XÓA YÊU CẦU ---
    @Transactional
    public void deleteRequest(UUID requestId) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu ID: " + requestId));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể xóa đơn đang chờ duyệt (PENDING).");
        }

        requestRepo.delete(req);
    }
}