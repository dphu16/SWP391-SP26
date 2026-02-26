package com.project.hrm.module.request.service;

import com.project.hrm.module.request.dto.RequestDTO;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestRepository requestRepo;

    // --- 1. TẠO YÊU CẦU MỚI (EMPLOYEE) ---
    public Request createRequest(RequestDTO dto) {
        Request req = new Request();
        req.setEmployeeId(dto.getEmployeeId());
        req.setRequestType(dto.getRequestType());
        req.setReason(dto.getReason());
        req.setStartDate(dto.getStartDate());
        req.setEndDate(dto.getEndDate());
        // Status mặc định là PENDING do @PrePersist xử lý bên Entity
        return requestRepo.save(req);
    }

    // --- 2. XEM YÊU CẦU CÁ NHÂN (EMPLOYEE) ---
    public List<Request> getMyRequests(UUID empId) {
        return requestRepo.findByEmployeeIdOrderByCreatedAtDesc(empId);
    }

    // --- 3. XEM TẤT CẢ (MANAGER) ---
    public List<Request> getAllRequests() {
        return requestRepo.findAllByOrderByCreatedAtDesc();
    }

    // ================= SỬA ĐOẠN DƯỚI NÀY =================

    // --- 4. DUYỆT YÊU CẦU (APPROVE) ---
    // Khớp với API: PUT .../{id}/approve
    public Request approveRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu!"));

        req.setStatus("APPROVED"); // Ép cứng trạng thái là Đã duyệt

        // Lưu lời nhắn của sếp (nếu có)
        if (dto != null && dto.getManagerComment() != null) {
            req.setManagerComment(dto.getManagerComment());
        }

        return requestRepo.save(req);
    }

    // --- 5. TỪ CHỐI YÊU CẦU (REJECT) ---
    // Khớp với API: PUT .../{id}/reject
    public Request rejectRequest(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu!"));

        req.setStatus("REJECTED"); // Ép cứng trạng thái là Từ chối

        // Lưu lý do từ chối (Bắt buộc hoặc tùy chọn tùy bạn)
        if (dto != null && dto.getManagerComment() != null) {
            req.setManagerComment(dto.getManagerComment());
        }

        return requestRepo.save(req);
    }
}