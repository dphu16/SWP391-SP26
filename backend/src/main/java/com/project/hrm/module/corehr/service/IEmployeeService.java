package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.dto.EmployeeDTO;
import com.project.hrm.module.corehr.dto.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.CreateNewHireDTO;
import com.project.hrm.module.corehr.ResponseDTO.InactiveEmployeeResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface IEmployeeService {

    Page<EmployeeDTO> getAllEmployees(Pageable pageable);

    EmployeeDetailDTO getEmployeeDetail(UUID id);

    EmployeeDetailDTO updateEmployee(UUID id, EmployeeChangeDTO req);

    NewHireResponseDTO createNewHire(CreateNewHireDTO request);

    List<InactiveEmployeeResponseDTO> getInactiveEmployees();
}
