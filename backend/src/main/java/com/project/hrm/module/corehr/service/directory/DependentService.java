package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.response.DependentDTO;
import com.project.hrm.module.corehr.entity.Dependent;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.enums.ErrorCode;
import com.project.hrm.module.corehr.repository.DependentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DependentService {

    private final DependentRepository dependentRepository;
    private final EmployeeRepository employeeRepository;

    public DependentService(DependentRepository dependentRepository,
            EmployeeRepository employeeRepository) {
        this.dependentRepository = dependentRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<DependentDTO> getDependentsByEmployeeId(UUID employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND,
                    "Employee not found with id: " + employeeId);
        }

        return dependentRepository.findByEmployee_EmployeeId(employeeId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public DependentDTO createDependent(UUID employeeId, DependentDTO dto) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Employee not found with id: " + employeeId));

        Dependent dependent = Dependent.builder()
                .employee(employee)
                .contactName(dto.getFullName())
                .phone(dto.getPhone())
                .relationship(dto.getRelationship())
                .address(dto.getAddress())
                .build();

        return toDTO(dependentRepository.save(dependent));
    }

    @Transactional
    public DependentDTO updateDependent(UUID dependentId, DependentDTO dto) {
        Dependent dependent = dependentRepository.findById(dependentId)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Dependent not found with id: " + dependentId));

        dependent.setContactName(dto.getFullName());
        dependent.setPhone(dto.getPhone());
        dependent.setRelationship(dto.getRelationship());
        dependent.setAddress(dto.getAddress());

        return toDTO(dependentRepository.save(dependent));
    }

    private DependentDTO toDTO(Dependent entity) {
        return DependentDTO.builder()
                .id(entity.getDependentId())
                .fullName(entity.getContactName())
                .relationship(entity.getRelationship())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .build();
    }
}
