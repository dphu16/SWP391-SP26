package com.project.hrm.request.service;

import com.project.hrm.attendance.dto.RequestDTO;
import com.project.hrm.request.entity.Request;
import com.project.hrm.request.repository.RequestRepository;
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
        // Status mặc định là PENDING do @PrePersist xử lý
        return requestRepo.save(req);
    }

    // --- 2. XEM YÊU CẦU CÁ NHÂN (EMPLOYEE) ---
    public List<Request> getMyRequests(UUID empId) {
        return requestRepo.findByEmployeeIdOrderByCreatedAtDesc(empId);
    }

    // --- 3. XEM TẤT CẢ (MANAGER) ---
    // (Dùng để hiển thị danh sách cho sếp vào duyệt)
    public List<Request> getAllRequests() {
        return requestRepo.findAllByOrderByCreatedAtDesc();
    }

    // --- 4. DUYỆT / TỪ CHỐI (MANAGER) ---
    public Request updateStatus(UUID requestId, RequestDTO dto) {
        Request req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu!"));

        // Cập nhật trạng thái (APPROVED / REJECTED)
        if (dto.getStatus() != null) {
            req.setStatus(dto.getStatus());
        }
        // Cập nhật comment của sếp
        if (dto.getManagerComment() != null) {
            req.setManagerComment(dto.getManagerComment());
        }

        return requestRepo.save(req);
    }
}