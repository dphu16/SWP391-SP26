package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.entity.*;

import java.util.ArrayList;
import java.util.List;

public class NewHireMapper {

        private NewHireMapper() {
        }

        public static Employee toEntity(CreateNewHireDTO dto, Department department, Position position,
                        Dependent dependent) {
                Employee employee = Employee.builder()
                                .fullName(dto.getFullName())
                                .department(department)
                                .position(position)
                                .build();

                Personal personal = Personal.builder()
                                .employee(employee)
                                .email(dto.getEmail())
                                .phone(dto.getPhone())
                                .gender(dto.getGender())
                                .address(dto.getAddress())
                                .citizenId(dto.getCitizenId())
                                .taxCode(dto.getTaxCode())
                                .dateOfBirth(dto.getDateOfBirth())
                                .avatar(dto.getAvatarUrl())
                                .build();

                employee.setPersonal(personal);

                if (dependent != null) {
                        dependent.setEmployee(employee);
                        List<Dependent> dependents = new ArrayList<>();
                        dependents.add(dependent);
                        employee.setDependents(dependents);
                }

                return employee;
        }

        public static NewHireResponseDTO toResponseDTO(Employee e, String rawPassword) {
                return NewHireResponseDTO.builder()
                                .employeeId(e.getEmployeeId())
                                .employeeCode(e.getEmployeeCode())
                                .fullName(e.getPersonal() != null ? e.getFullName() : null)
                                .phone(e.getPersonal() != null ? e.getPersonal().getPhone() : null)
                                .email(e.getPersonal().getEmail())
                                .gender(e.getPersonal() != null ? e.getPersonal().getGender() : null)
                                .address(e.getPersonal() != null ? e.getPersonal().getAddress() : null)
                                .departmentName(e.getDepartment() != null ? e.getDepartment().getDeptName() : null)
                                .positionTitle(e.getPosition() != null ? e.getPosition().getTitle() : null)
                                .dependentName((e.getDependents() != null && !e.getDependents().isEmpty())
                                                ? e.getDependents().get(0).getFullName()
                                                : null)
                                .relationship((e.getDependents() != null && !e.getDependents().isEmpty())
                                                ? e.getDependents().get(0).getRelationship()
                                                : null)
                                .baseSalaryMin(e.getPosition() != null ? e.getPosition().getBaseSalaryMin() : null)
                                .baseSalaryMax(e.getPosition() != null ? e.getPosition().getBaseSalaryMax() : null)
                                .citizenId(e.getPersonal() != null ? e.getPersonal().getCitizenId() : null)
                                .taxCode(e.getPersonal() != null ? e.getPersonal().getTaxCode() : null)
                                .dateOfBirth(e.getPersonal() != null ? e.getPersonal().getDateOfBirth() : null)
                                .avatarUrl(e.getPersonal() != null ? e.getPersonal().getAvatar() : null)
                                .status(e.getEmpStatus())
                                .role(e.getUser() != null ? e.getUser().getRole() : null)
                                .username(e.getUser() != null ? e.getUser().getUsername() : null)
                                .rawPassword(rawPassword)
                                .createdAt(e.getUser() != null ? e.getUser().getCreatedAt() : null)
                                .build();
        }
}
