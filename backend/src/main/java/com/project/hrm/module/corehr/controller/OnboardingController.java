package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.ResponseDTO.OnboardingResponseDTO;
import com.project.hrm.module.corehr.service.OnboardingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class OnboardingController {

    private final OnboardingService applicationService;

    public OnboardingController(OnboardingService applicationService) {
        this.applicationService = applicationService;
    }

    /** 
     * Lấy danh sách ứng viên đã được tuyển (HIRED).
     * 
     * Hỗ trợ phân trang:
     * - page: số trang (bắt đầu từ 0)
     * - size: số bản ghi mỗi trang (mặc định 10)
     * - sort: sắp xếp (mặc định theo createdAt giảm dần)
     * 
     * Ví dụ: GET /api/applications/hired?page=0&size=10&sort=createdAt,desc
     */
    @GetMapping("/applications/hired")
    @PreAuthorize("hasAuthority('HR')")
    public ResponseEntity<Page<OnboardingResponseDTO>> getHiredApplications(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        Page<OnboardingResponseDTO> result = applicationService.getHiredApplications(pageable);
        return ResponseEntity.ok(result);
    }
}
