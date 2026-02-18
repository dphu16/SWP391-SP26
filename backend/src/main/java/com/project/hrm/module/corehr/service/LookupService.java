package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.dto.DepartmentOptionDTO;
import com.project.hrm.module.corehr.dto.PositionOptionDTO;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service cung cấp dữ liệu lookup (dropdown) cho frontend.
 * Tách biệt khỏi EmployeeService để đảm bảo Single Responsibility.
 */
@Service
public class LookupService {

    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    public LookupService(DepartmentRepository departmentRepository,
            PositionRepository positionRepository) {
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
    }

    /**
     * Trả về danh sách tất cả phòng ban (id + tên) để hiển thị dropdown.
     * Sắp xếp theo tên phòng ban tăng dần.
     */
    @Transactional(readOnly = true)
    public List<DepartmentOptionDTO> getAllDepartmentOptions() {
        return departmentRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getDeptName().compareToIgnoreCase(b.getDeptName()))
                .map(d -> new DepartmentOptionDTO(d.getDeptId(), d.getDeptName()))
                .toList();
    }

    /**
     * Trả về danh sách tất cả vị trí/chức danh (id + title) để hiển thị dropdown.
     * Sắp xếp theo title tăng dần.
     */
    @Transactional(readOnly = true)
    public List<PositionOptionDTO> getAllPositionOptions() {
        return positionRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getTitle().compareToIgnoreCase(b.getTitle()))
                .map(p -> new PositionOptionDTO(p.getPositionId(), p.getTitle()))
                .toList();
    }
}
