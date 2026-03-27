package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeSelfUpdateDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class EmployeeSelfUpdateService {

    private final EmployeeHelper employeeHelper;

    public EmployeeSelfUpdateService(EmployeeHelper employeeHelper) {
        this.employeeHelper = employeeHelper;
    }



    @Transactional
    public EmployeeDetailDTO selfUpdate(UUID employeeId, EmployeeSelfUpdateDTO dto) {
        Employee employee = employeeHelper.findEmployeeOrThrow(employeeId);
        List<String> updatedFields = new ArrayList<>();

        if (dto.getPhone() != null && !dto.getPhone().equals(employee.getPersonal().getPhone())) {
            employee.getPersonal().setPhone(dto.getPhone());
            updatedFields.add("phone");
        }



        if (dto.getAddress() != null && !dto.getAddress().equals(employee.getPersonal().getAddress())) {
            employee.getPersonal().setAddress(dto.getAddress());
            updatedFields.add("address");
        }

        Employee saved = employeeHelper.save(employee);



        return EmployeeDetailMapper.toDTO(saved);
    }




}
