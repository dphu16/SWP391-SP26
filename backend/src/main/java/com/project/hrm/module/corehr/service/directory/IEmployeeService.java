package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface IEmployeeService {

    Page<EmployeeDTO> getAllEmployees(Pageable pageable);

    EmployeeDetailDTO getEmployeeDetail(UUID id);

    EmployeeDetailDTO updateEmployee(UUID id, EmployeeChangeDTO req);



    Page<EmployeeDTO> searchEmployees(String fullName, String employeeCode, String phoneNumber, String department,
            String position, String role, String status, Pageable pageable);
}
