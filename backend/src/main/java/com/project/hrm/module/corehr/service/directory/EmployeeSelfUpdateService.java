package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeSelfUpdateDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.response.FieldCooldownDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.FieldCooldown;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.repository.FieldCooldownRepository;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class EmployeeSelfUpdateService {

    private static final long COOLDOWN_MONTHS = 6;
    private static final Set<String> ALLOWED_FIELDS = Set.of("phone", "email", "address");

    private final EmployeeHelper employeeHelper;
    private final FieldCooldownRepository cooldownRepository;

    public EmployeeSelfUpdateService(EmployeeHelper employeeHelper,
            FieldCooldownRepository cooldownRepository) {
        this.employeeHelper = employeeHelper;
        this.cooldownRepository = cooldownRepository;
    }

    public List<FieldCooldownDTO> getCooldowns(UUID employeeId) {
        LocalDateTime now = LocalDateTime.now();
        List<FieldCooldown> cooldowns = cooldownRepository.findByEmployee_EmployeeId(employeeId);

        List<FieldCooldownDTO> result = new ArrayList<>();
        for (String field : ALLOWED_FIELDS) {
            Optional<FieldCooldown> cd = cooldowns.stream()
                    .filter(c -> c.getFieldName().equals(field))
                    .findFirst();
            if (cd.isPresent()) {
                FieldCooldown fc = cd.get();
                result.add(FieldCooldownDTO.builder()
                        .fieldName(field)
                        .changedAt(fc.getChangedAt())
                        .cooldownUntil(fc.getCooldownUntil())
                        .locked(fc.getCooldownUntil().isAfter(now))
                        .build());
            } else {
                result.add(FieldCooldownDTO.builder()
                        .fieldName(field)
                        .locked(false)
                        .build());
            }
        }
        return result;
    }

    @Transactional
    public EmployeeDetailDTO selfUpdate(UUID employeeId, EmployeeSelfUpdateDTO dto) {
        Employee employee = employeeHelper.findEmployeeOrThrow(employeeId);
        LocalDateTime now = LocalDateTime.now();
        List<String> updatedFields = new ArrayList<>();

        if (dto.getPhone() != null && !dto.getPhone().equals(employee.getPersonal().getPhone())) {
            validateCooldown(employeeId, "phone", now);
            employee.getPersonal().setPhone(dto.getPhone());
            updatedFields.add("phone");
        }

        if (dto.getEmail() != null && !dto.getEmail().equals(employee.getPersonal().getEmail())) {
            validateCooldown(employeeId, "email", now);
            employee.getPersonal().setEmail(dto.getEmail());
            // Also update login email
            if (employee.getUser() != null) {
                employee.getUser().setEmail(dto.getEmail());
            }
            updatedFields.add("email");
        }

        if (dto.getAddress() != null && !dto.getAddress().equals(employee.getPersonal().getAddress())) {
            validateCooldown(employeeId, "address", now);
            employee.getPersonal().setAddress(dto.getAddress());
            updatedFields.add("address");
        }

        Employee saved = employeeHelper.save(employee);

        // Set cooldowns for changed fields
        for (String field : updatedFields) {
            setCooldown(employeeId, field, now);
        }

        return EmployeeDetailMapper.toDTO(saved);
    }

    private void validateCooldown(UUID employeeId, String fieldName, LocalDateTime now) {
        boolean locked = cooldownRepository
                .existsByEmployee_EmployeeIdAndFieldNameAndCooldownUntilAfter(employeeId, fieldName, now);
        if (locked) {
            throw new RuntimeException(
                    "Trường '" + fieldName + "' đang trong thời gian cooldown (6 tháng). "
                            + "Vui lòng liên hệ HR để thay đổi.");
        }
    }

    private void setCooldown(UUID employeeId, String fieldName, LocalDateTime now) {
        Optional<FieldCooldown> existing = cooldownRepository
                .findByEmployee_EmployeeIdAndFieldName(employeeId, fieldName);

        FieldCooldown cooldown;
        if (existing.isPresent()) {
            cooldown = existing.get();
            cooldown.setChangedAt(now);
            cooldown.setCooldownUntil(now.plusMonths(COOLDOWN_MONTHS));
        } else {
            Employee employee = employeeHelper.findEmployeeOrThrow(employeeId);
            cooldown = FieldCooldown.builder()
                    .employee(employee)
                    .fieldName(fieldName)
                    .changedAt(now)
                    .cooldownUntil(now.plusMonths(COOLDOWN_MONTHS))
                    .build();
        }
        cooldownRepository.save(cooldown);
    }
}
