package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.mapper.EmployeeMapper;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
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

    public List<Employee> findActiveEmployeesForPayroll() {
        return employeeRepository.findActiveEmployeesForPayroll();
    }

}
