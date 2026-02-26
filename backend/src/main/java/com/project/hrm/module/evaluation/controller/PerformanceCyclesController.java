package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.evaluation.dto.CycleStatusRequest;
import com.project.hrm.module.evaluation.dto.PerformanceCyclesRequest;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.service.PerformanceCyclesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// Thêm CrossOrigin để đồng bộ với các Controller khác, giúp Frontend (5173) gọi được API
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/performance-cycles")
public class PerformanceCyclesController {

    private final PerformanceCyclesService service;

    public PerformanceCyclesController(PerformanceCyclesService service) {
        this.service = service;
    }

    // 1. Lấy tất cả các kỳ đánh giá
    @GetMapping
    public ResponseEntity<List<PerformanceCycles>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // 2. Tạo mới một kỳ đánh giá
    @PostMapping
    public ResponseEntity<PerformanceCycles> create(
            @RequestBody PerformanceCyclesRequest request){
        return ResponseEntity.ok(service.create(request));
    }

    // 3. Cập nhật toàn bộ thông tin kỳ đánh giá (Giữ từ File 1)
    @PutMapping("/{id}")
    public ResponseEntity<PerformanceCycles> update(
            @PathVariable UUID id,
            @RequestBody PerformanceCyclesRequest request){
        return ResponseEntity.ok(service.update(id, request));
    }

    // 4. Cập nhật chỉ trạng thái (Active/Inactive)
    @PatchMapping("/{id}")
    public ResponseEntity<PerformanceCycles> updateStatus(
            @PathVariable UUID id,
            @RequestBody CycleStatusRequest request){
        return ResponseEntity.ok(service.updateStatus(id, request));
    }
}