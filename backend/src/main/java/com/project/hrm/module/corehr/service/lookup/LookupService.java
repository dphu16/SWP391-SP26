package com.project.hrm.module.corehr.service.lookup;

import com.project.hrm.module.corehr.dto.request.DepartmentOptionDTO;
import com.project.hrm.module.corehr.dto.request.PositionOptionDTO;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LookupService {

    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    public LookupService(DepartmentRepository departmentRepository,
            PositionRepository positionRepository) {
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentOptionDTO> getAllDepartmentOptions() {
        return departmentRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getDeptName().compareToIgnoreCase(b.getDeptName()))
                .map(d -> new DepartmentOptionDTO(d.getDeptId(), d.getDeptName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PositionOptionDTO> getAllPositionOptions() {
        return positionRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getTitle().compareToIgnoreCase(b.getTitle()))
                .map(p -> new PositionOptionDTO(
                        p.getPositionId(),
                        p.getTitle(),
                        p.getDepartment() != null ? p.getDepartment().getDeptId() : null,
                        p.getDepartment() != null ? p.getDepartment().getDeptName() : null,
                        p.getBaseSalaryMin(),
                        p.getBaseSalaryMax()))
                .toList();
    }
}
