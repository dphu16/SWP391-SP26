package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeRole;

public class NewHireMapper {

        private NewHireMapper() {
        }

        public static Employee toEntity(CreateNewHireDTO dto, Department department, Position position) {
                Employee employee = Employee.builder()
                                .fullName(dto.getFullName())
                                .department(department)
                                .position(position)
                                .dateOfJoining(dto.getDateOfJoining())
                                .build();

                // Calculate endDate based on contractDuration
                java.time.LocalDate computedStartDate = dto.getStartDate() != null ? dto.getStartDate() : java.time.LocalDate.now();
                java.time.LocalDate computedEndDate = dto.getEndDate();

                if (dto.getContractDuration() != null) {
                        switch (dto.getContractDuration()) {
                                case "6_MONTHS":
                                        computedEndDate = computedStartDate.plusMonths(6);
                                        break;
                                case "1_YEAR":
                                        computedEndDate = computedStartDate.plusYears(1);
                                        break;
                                case "2_YEARS":
                                        computedEndDate = computedStartDate.plusYears(2);
                                        break;
                                case "INDEFINITE":
                                        computedEndDate = null;
                                        break;
                                case "CUSTOM":
                                default:
                                        // Use the endDate from the DTO as-is
                                        break;
                        }
                }

                Contract contract = Contract.builder()
                                .employee(employee)
                                .contractNumber(dto.getContractNumber() != null ? dto.getContractNumber()
                                                : "CTR-" + java.util.UUID.randomUUID().toString().substring(0, 8)
                                                                .toUpperCase())
                                .contractType(dto.getContractType() != null ? dto.getContractType() : "PROBATION")
                                .startDate(computedStartDate)
                                .endDate(computedEndDate)
                                .baseSalary(dto.getBaseSalary())
                                .status("ACTIVE")
                                .build();

                employee.setContract(contract);

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
                EmployeeRole primaryRole = null;
                if (e.getUser() != null && e.getUser().getRoles() != null) {
                        primaryRole = e.getUser().getRoles().stream()
                                        .map(Role::getName)
                                        .findFirst()
                                        .orElse(null);
                }

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
                                .role(primaryRole)
                                .status(e.getEmpStatus())
                                .dependentName((e.getDependents() != null && !e.getDependents().isEmpty())
                                                ? e.getDependents().get(0).getContactName()
                                                : null)
                                .relationship((e.getDependents() != null && !e.getDependents().isEmpty())
                                                ? e.getDependents().get(0).getRelationship()
                                                : null)
                                .baseSalary(e.getContract() != null &&
                                        (e.getContract().getEndDate() == null || e.getContract().getEndDate().isAfter(java.time.LocalDate.now()))
                                        ? e.getContract().getBaseSalary()
                                        : null)
                                .citizenId(e.getPersonal() != null ? e.getPersonal().getCitizenId() : null)
                                .taxCode(e.getPersonal() != null ? e.getPersonal().getTaxCode() : null)
                                .dateOfBirth(e.getPersonal() != null ? e.getPersonal().getDateOfBirth() : null)
                                .avatarUrl(e.getPersonal() != null ? e.getPersonal().getAvatar() : null)
                                .build();
        }
}
