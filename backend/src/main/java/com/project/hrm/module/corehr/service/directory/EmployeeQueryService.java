package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.mapper.EmployeeMapper;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.service.specification.EmployeeSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class EmployeeQueryService {
    private final EmployeeRepository employeeRepository;

    public EmployeeQueryService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;

    }

    public Page<EmployeeDTO> getAllEmployees(Pageable pageable) {
        return employeeRepository.findAllWithDetails(pageable)
                .map(EmployeeMapper::toDTO);
    }

    public EmployeeDetailDTO getEmployeeDetail(UUID id) {
        return EmployeeDetailMapper.toDTO(
                employeeRepository.findByIdWithDetails(id)
                        .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id)));
    }

    public Page<EmployeeDTO> searchEmployees(String q, String fullName, String employeeCode, String phoneNumber,
            String department,
            String position, String role, String status, UUID deptId, Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<com.project.hrm.module.corehr.entity.Employee> spec = EmployeeSpecification
                .filterEmployees(q, fullName, employeeCode, phoneNumber, department, position, role, status, deptId);

        return employeeRepository.findAll(spec, pageable).map(EmployeeMapper::toDTO);
    }

}
