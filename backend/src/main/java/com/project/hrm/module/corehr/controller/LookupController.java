package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.DepartmentOptionDTO;
import com.project.hrm.module.corehr.dto.PositionOptionDTO;
import com.project.hrm.module.corehr.service.LookupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller cung cấp dữ liệu tham chiếu (lookup/dropdown) cho frontend.
 *
 * <p>
 * Các endpoint này được dùng để populate select box khi tạo/sửa nhân viên,
 * không yêu cầu phân trang vì số lượng phòng ban và vị trí thường nhỏ.
 */
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/lookup")
public class LookupController {

    private final LookupService lookupService;

    public LookupController(LookupService lookupService) {
        this.lookupService = lookupService;
    }

    /**
     * GET /api/lookup/departments
     *
     * <p>
     * Trả về danh sách tất cả phòng ban (id + tên), sắp xếp A→Z.
     * Frontend dùng để render dropdown chọn phòng ban.
     *
     * <p>
     * Response example:
     * 
     * <pre>
     * [
     *   { "id": "uuid-1", "name": "Engineering" },
     *   { "id": "uuid-2", "name": "Human Resources" }
     * ]
     * </pre>
     */
    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentOptionDTO>> getDepartments() {
        return ResponseEntity.ok(lookupService.getAllDepartmentOptions());
    }

    /**
     * GET /api/lookup/positions
     *
     * <p>
     * Trả về danh sách tất cả vị trí/chức danh (id + title), sắp xếp A→Z.
     * Frontend dùng để render dropdown chọn vị trí.
     *
     * <p>
     * Response example:
     * 
     * <pre>
     * [
     *   { "id": "uuid-1", "title": "Backend Developer" },
     *   { "id": "uuid-2", "title": "HR Manager" }
     * ]
     * </pre>
     */
    @GetMapping("/positions")
    public ResponseEntity<List<PositionOptionDTO>> getPositions() {
        return ResponseEntity.ok(lookupService.getAllPositionOptions());
    }
}
