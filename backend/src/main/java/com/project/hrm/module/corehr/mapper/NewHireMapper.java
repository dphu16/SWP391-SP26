package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.CreateNewHireDTO;
import com.project.hrm.module.corehr.service.NewHireResponseDTO;
import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;

public class NewHireMapper {

    private NewHireMapper() {
    }

    public static Employee toEntity(CreateNewHireDTO dto, Department department, Position position) {
        return Employee.builder()
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .gender(dto.getGender())
                .address(dto.getAddress())
                .citizenId(dto.getCitizenId())
                .taxCode(dto.getTaxCode())
                .dateOfBirth(dto.getDateOfBirth())
                .avatarUrl(dto.getAvatarUrl())
                .sourceApplicationId(dto.getSourceApplicationId())
                .department(department)
                .position(position)
                .build();
    }

    /**
     * Maps a saved {@link Employee} to the response DTO.
     *
     * @param e           the persisted employee (with linked User)
     * @param rawPassword the plain-text password generated before hashing —
     *                    returned once to the admin
     */
    public static NewHireResponseDTO toResponseDTO(Employee e, String rawPassword) {
        return NewHireResponseDTO.builder()
                .employeeId(e.getEmployeeId())
                .employeeCode(e.getEmployeeCode())
                .fullName(e.getFullName())
                .phone(e.getPhone())
                .email(e.getEmail())
                .gender(e.getGender())
                .address(e.getAddress())
                .departmentName(e.getDepartment() != null ? e.getDepartment().getDeptName() : null)
                .positionTitle(e.getPosition() != null ? e.getPosition().getTitle() : null)
                .citizenId(e.getCitizenId())
                .taxCode(e.getTaxCode())
                .dateOfBirth(e.getDateOfBirth())
                .avatarUrl(e.getAvatarUrl())
                .status(e.getStatusPos())
                .role(e.getUser() != null ? e.getUser().getRole() : null)
                .username(e.getUser() != null ? e.getUser().getUsername() : null)
                .rawPassword(rawPassword)
                .createdAt(e.getCreatedAt())
                .build();
    }
}
