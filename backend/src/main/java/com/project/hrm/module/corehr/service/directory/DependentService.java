package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.response.DependentDTO;
import com.project.hrm.module.corehr.entity.Dependent;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
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

    /**
     * Lấy danh sách người phụ thuộc theo employeeId.
     * Throw exception nếu employee không tồn tại.
     */
    @Transactional(readOnly = true)
    public List<DependentDTO> getDependentsByEmployeeId(UUID employeeId) {
        // Kiểm tra employee tồn tại trước khi truy vấn dependents
        if (!employeeRepository.existsById(employeeId)) {
            throw new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND,
                    "Employee not found with id: " + employeeId);
        }

        return dependentRepository.findByEmployee_EmployeeId(employeeId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // Chuyển đổi Entity → DTO
    private DependentDTO toDTO(Dependent entity) {
        return DependentDTO.builder()
                .id(entity.getDependentId())
                .fullName(entity.getContactName())
                .dateOfBirth(entity.getDateOfBirth())
                .relationship(entity.getRelationship())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .status(entity.getStatus())
                .build();
    }
}
