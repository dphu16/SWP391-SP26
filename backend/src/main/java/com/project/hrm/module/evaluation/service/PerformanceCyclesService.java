package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.CycleStatusRequest;
import com.project.hrm.module.evaluation.dto.PerformanceCyclesRequest;
import com.project.hrm.module.evaluation.entity.PerformanceCycles;
import com.project.hrm.module.evaluation.enums.CycleStatus;
import com.project.hrm.module.evaluation.repository.PerformanceCyclesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PerformanceCyclesService {

    private final PerformanceCyclesRepository repository;

    public PerformanceCyclesService(PerformanceCyclesRepository repository) {
        this.repository = repository;
    }

    // 1. Tạo chu kỳ mới - Mặc định để DRAFT (theo File 2) để an toàn
    @Transactional
    public PerformanceCycles create(PerformanceCyclesRequest req) {
        validateDates(req);

        PerformanceCycles cycle = new PerformanceCycles();
        cycle.setCycleName(req.getCycleName());
        cycle.setStartDate(req.getStartDate());
        cycle.setEndDate(req.getEndDate());
        cycle.setStatus(CycleStatus.DRAFT);
        cycle.setCreatedAt(LocalDateTime.now());

        return repository.save(cycle);
    }

    // 2. Cập nhật thông tin (Giữ từ File 1)
    @Transactional
    public PerformanceCycles update(UUID id, PerformanceCyclesRequest req) {
        PerformanceCycles cycle = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        // Chỉ cho phép sửa nếu chưa đóng
        if (cycle.getStatus() == CycleStatus.CLOSED) {
            throw new RuntimeException("Cannot edit a closed cycle");
        }

        validateDates(req);

        cycle.setCycleName(req.getCycleName());
        cycle.setStartDate(req.getStartDate());
        cycle.setEndDate(req.getEndDate());

        return repository.save(cycle);
    }

    // 3. Lấy danh sách
    public List<PerformanceCycles> getAll() {
        return repository.findAll();
    }

    // 4. Cập nhật trạng thái theo luồng DRAFT -> ACTIVE -> CLOSED (Giữ từ File 2)
    @Transactional
    public PerformanceCycles updateStatus(UUID id, CycleStatusRequest req) {
        PerformanceCycles cycle = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cycle not found"));

        CycleStatus current = cycle.getStatus();
        CycleStatus next = req.getStatus();

        // Kiểm tra logic chuyển đổi trạng thái
        if (current == CycleStatus.DRAFT && next != CycleStatus.ACTIVE)
            throw new RuntimeException("Draft cycle must be activated first");

        if (current == CycleStatus.ACTIVE && next != CycleStatus.CLOSED)
            throw new RuntimeException("Active cycle can only be closed");

        if (current == CycleStatus.CLOSED)
            throw new RuntimeException("Cycle is already closed and cannot be changed");

        cycle.setStatus(next);
        return repository.save(cycle);
    }

    // Hàm phụ trợ để tránh lặp code validate ngày tháng
    private void validateDates(PerformanceCyclesRequest req) {
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new RuntimeException("End date must be after start date");
        }
    }
}