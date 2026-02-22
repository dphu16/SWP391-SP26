package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.ResponseDTO.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.dto.*;
import com.project.hrm.module.corehr.service.IEmployeeService;
import com.project.hrm.module.corehr.service.NewHireResponseDTO;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller quản lý API liên quan đến Employee.
 *
 * <p>
 * Tuân thủ RESTful best practices:
 * <ul>
 * <li>Danh từ số nhiều cho resource: {@code /employees}</li>
 * <li>HTTP verb phù hợp: GET cho truy vấn, POST cho tạo mới, PUT cho cập
 * nhật</li>
 * <li>Trả về HTTP status code ngữ nghĩa: 200 OK, 201 Created</li>
 * <li>Phụ thuộc vào interface {@link IEmployeeService} (Dependency
 * Inversion)</li>
 * </ul>
 */
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class EmployeeController {

    private final IEmployeeService employeeService;

    public EmployeeController(IEmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // Danh sách toàn bộ nhân viên
    @GetMapping("/hr/employees")
    public ResponseEntity<Page<EmployeeDTO>> getAllEmployees(
            @PageableDefault(size = 10, sort = "fullName") Pageable pageable) {
        return ResponseEntity.ok(employeeService.getAllEmployees(pageable));
    }

    // Danh sách nhân viên TERMINATED/RESIGNED
    @GetMapping("/employees/inactive")
    @PreAuthorize("hasAuthority('HR')")
    public ResponseEntity<List<InactiveEmployeeResponseDTO>> getInactiveEmployees() {
        List<InactiveEmployeeResponseDTO> inactiveList = employeeService.getInactiveEmployees();
        return ResponseEntity.ok(inactiveList);
    }

    // Chi tiết một nhân viên
    @GetMapping("employee/{id}/view-detail")
    public ResponseEntity<EmployeeDetailDTO> getEmployeeDetail(@PathVariable("id") UUID id) {
        EmployeeDetailDTO dto = employeeService.getEmployeeDetail(id);
        return ResponseEntity.ok(dto);
    }

    // Cập nhật thông tin nhân viên
    @PutMapping("/employees/{id}/edit")
    public ResponseEntity<EmployeeDetailDTO> updateEmployee(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EmployeeChangeDTO req) {
        EmployeeDetailDTO updated = employeeService.updateEmployee(id, req);
        return ResponseEntity.ok(updated);
    }

    // Tạo mới nhân viên
    @PostMapping("/employees/new")
    public ResponseEntity<NewHireResponseDTO> createEmployee(
            @Valid @RequestBody CreateNewHireDTO request) {

        NewHireResponseDTO response = employeeService.createNewHire(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
