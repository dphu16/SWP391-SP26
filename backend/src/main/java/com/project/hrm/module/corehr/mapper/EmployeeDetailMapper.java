package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.response.ContractResponseDTO;
import com.project.hrm.module.corehr.entity.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class EmployeeDetailMapper {

    public static EmployeeDetailDTO toDTO(Employee employee) {
        User user = employee.getUser();
        Department department = employee.getDepartment();
        Position position = employee.getPosition();

        List<ContractResponseDTO> contractDTOs = null;
        if (employee.getContracts() != null && !employee.getContracts().isEmpty()) {
            contractDTOs = employee.getContracts().stream()
                    .map(c -> ContractResponseDTO.builder()
                            .contractId(c.getContractId())
                            .contractNumber(c.getContractNumber())
                            .contractType(c.getContractType())
                            .startDate(c.getStartDate())
                            .endDate(c.getEndDate())
                            .baseSalary(c.getBaseSalary())
                            .status(c.getStatus())
                            .build())
                    .collect(Collectors.toList());
        }

        return EmployeeDetailDTO.builder()
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .avatarUrl(employee.getPersonal().getAvatar())
                .fullName(employee.getFullName())
                .email(user != null ? user.getEmail() : employee.getPersonal().getEmail())
                .phone(employee.getPersonal().getPhone())
                .address(employee.getPersonal().getAddress())
                .gender(employee.getPersonal().getGender())
                .citizenId(employee.getPersonal().getCitizenId())
                .taxCode(employee.getPersonal().getTaxCode())
                .dateOfBirth(employee.getPersonal().getDateOfBirth())
                .dateOfJoining(employee.getDateOfJoining())
                .roles(user != null ? user.getRoles().stream()
                        .map(r -> r.getName().name())
                        .collect(Collectors.toSet()) : Collections.emptySet())
                .positionTitle(position != null ? position.getTitle() : null)
                .deptName(department != null ? department.getDeptName() : null)
                .statusEmp(employee.getStatus())
                .status(user != null ? user.getStatus() : null)
                .contracts(contractDTOs)
                .build();
    }
}
