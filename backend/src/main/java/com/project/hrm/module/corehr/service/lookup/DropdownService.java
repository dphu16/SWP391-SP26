
package com.project.hrm.module.corehr.service.lookup;

import com.project.hrm.module.corehr.dto.request.DepartmentOptionDTO;
import com.project.hrm.module.corehr.dto.request.PositionOptionDTO;
import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DropdownService {

    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    public DropdownService(DepartmentRepository departmentRepository,
                         PositionRepository positionRepository) {
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentOptionDTO> getAllDepartmentOptions() {
        return departmentRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getDeptName().compareToIgnoreCase(b.getDeptName()))
                .map(d -> {
                    DepartmentOptionDTO dto = new DepartmentOptionDTO();
                    dto.setId(d.getDeptId());
                    dto.setName(d.getDeptName());
                    if (d.getManager() != null) {
                        dto.setManagerId(d.getManager().getEmployeeId());
                        dto.setManagerName(d.getManager().getFullName());
                    }
                    if (d.getMentor() != null) {
                        dto.setMentorId(d.getMentor().getEmployeeId());
                        dto.setMentorName(d.getMentor().getFullName());
                    }
                    return dto;
                })
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

    @Transactional(readOnly = true)
    public List<PositionOptionDTO> getPositionByDeptId(UUID deptId) {
        List<Position> position = positionRepository.findByDepartment_DeptId(deptId);
        return position.stream()
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

    @Transactional(readOnly = true)
    public DepartmentOptionDTO getDepartmentByManagerId(UUID id) {
        Department department = departmentRepository.findByManager_EmployeeId(id);

        return DepartmentOptionDTO.builder()
                .id(department.getDeptId())
                .name(department.getDeptName())
                .managerId(department.getManager() != null ? department.getManager().getEmployeeId() : null)
                .managerName(department.getManager() != null ? department.getManager().getFullName() : null)
                .mentorId(department.getMentor() != null ? department.getMentor().getEmployeeId() : null)
                .mentorName(department.getMentor() != null ? department.getMentor().getFullName() : null)
                .build();
    }
}
