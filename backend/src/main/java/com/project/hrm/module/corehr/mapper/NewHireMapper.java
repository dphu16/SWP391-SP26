package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.entity.*;

public class NewHireMapper {

        private NewHireMapper() {
        }

        public static Employee toEntity(CreateNewHireDTO dto, Department department, Position position) {
                Employee employee = Employee.builder()
                                .fullName(dto.getFullName())
                                .department(department)
                                .position(position)
                                .role(dto.getRole())
                                .dateOfJoining(dto.getDateOfJoining())
                                .build();

                Contract contract = Contract.builder()
                                .employee(employee)
                                .contractNumber(dto.getContractNumber() != null ? dto.getContractNumber()
                                                : "CTR-" + java.util.UUID.randomUUID().toString().substring(0, 8)
                                                                .toUpperCase())
                                .contractType(dto.getContractType() != null ? dto.getContractType() : "PROBATION")
                                .startDate(dto.getStartDate() != null ? dto.getStartDate() : java.time.LocalDate.now())
                                .endDate(dto.getEndDate())
                                .baseSalary(dto.getBaseSalary())
                                .status("ACTIVE")
                                .build();

                employee.getContracts().add(contract);

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

                return employee;
        }

        public static NewHireResponseDTO toResponseDTO(Employee e) {
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
                                .role(e.getRole())
                                .status(e.getEmpStatus())
                                .dependentName((e.getDependents() != null && !e.getDependents().isEmpty())
                                                ? e.getDependents().get(0).getContactName()
                                                : null)
                                .relationship((e.getDependents() != null && !e.getDependents().isEmpty())
                                                ? e.getDependents().get(0).getRelationship()
                                                : null)
                                .baseSalary(e.getContracts().stream()
                                        .filter(c -> c.getEndDate() == null || c.getEndDate().isAfter(java.time.LocalDate.now()))
                                        .max(java.util.Comparator.comparing(Contract::getStartDate))
                                        .map(Contract::getBaseSalary)
                                        .orElse(null))
                                .citizenId(e.getPersonal() != null ? e.getPersonal().getCitizenId() : null)
                                .taxCode(e.getPersonal() != null ? e.getPersonal().getTaxCode() : null)
                                .dateOfBirth(e.getPersonal() != null ? e.getPersonal().getDateOfBirth() : null)
                                .avatarUrl(e.getPersonal() != null ? e.getPersonal().getAvatar() : null)
                                .build();
        }
}
