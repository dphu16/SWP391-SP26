package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.dto.*;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import org.springframework.stereotype.Service;

import javax.swing.text.Position;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            PositionRepository positionRepository,
            DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.positionRepository = positionRepository;
        this.departmentRepository = departmentRepository;
    }

    protected Employee getEmployeeById(UUID id){
        return employeeRepository.findById(id).get();
    }

    public List<EmployeeDTO> getAllEmployees(){
        return employeeRepository.findAll().stream().map(
                e -> EmployeeMapper.toDTO(e)).collect(Collectors.toList());
    }

    public PersonalDTO getPersonalById(UUID id) {
        Employee employee = getEmployeeById(id);
        return PersonalMapper.toDTO(employee);
    }

    public JobDTO getJobById(UUID id) {
        Employee employee = getEmployeeById(id);
        return JobMapper.toDTO(employee);
    }

    public void updateSelf(UUID id, EmployeeChangeRequestDTO req){
        Employee e = getEmployeeById(id);

        e.setPhone(req.getPhone());
        e.setAddress(req.getAddress());
        e.setEmail(req.getEmail());

        employeeRepository.save(e);
    }


}
