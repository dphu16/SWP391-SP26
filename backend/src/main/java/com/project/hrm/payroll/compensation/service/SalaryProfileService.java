package com.project.hrm.payroll.compensation.service;

import com.project.hrm.payroll.compensation.dto.RequestDTO.CreateSalaryProfileRequest;
import com.project.hrm.payroll.compensation.dto.ResponseDTO.SalaryProfileResponse;
import com.project.hrm.payroll.compensation.entity.SalaryProfile;
import com.project.hrm.payroll.compensation.repository.SalaryProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SalaryProfileService {
    private final SalaryProfileRepository repository;
    public SalaryProfileResponse createInitialSalaryProfile(CreateSalaryProfileRequest request){
        repository.findByEmployeeIdAndEffectiveToIsNull(request.getEmployeeId())
                .ifPresent(sp ->{throw new IllegalStateException("Active salary profile already exists");
                });

        SalaryProfile profile = SalaryProfile.builder()
                .employeeId(request.getEmployeeId())
                .baseSalary(request.getBaseSalary())
                .allowances(request.getAllowances())
                .taxCode(request.getTaxCode())
                .effectiveFrom(request.getEffectiveFrom())
                .build();

        SalaryProfile saved = repository.save(profile);

        return mapToResponse(saved);
    }

    public SalaryProfileResponse increaseSalary(UUID employeeId, BigDecimal newSalary, LocalDate effectiveFrom){
        SalaryProfile current = repository.findByEmployeeIdAndEffectiveToIsNull(employeeId)
                .orElseThrow(() -> new IllegalStateException("No active salary profile"));

        if(!effectiveFrom.isAfter(current.getEffectiveFrom())){
            throw new IllegalStateException("Effective date must be after current profile");
        }

        //close old profile
        current.setEffectiveTo(effectiveFrom.minusDays(1));
        repository.saveAndFlush(current);

        SalaryProfile newProfile = SalaryProfile.builder()
                .employeeId(employeeId)
                .baseSalary(newSalary)
                .allowances(current.getAllowances())
                .taxCode(current.getTaxCode())
                .effectiveFrom(effectiveFrom)
                .build();

        SalaryProfile saved = repository.save(newProfile);

        return mapToResponse(saved);
    }

    public Optional<SalaryProfileResponse> getActiveProfile(UUID employeeId) {
        return repository.findByEmployeeIdAndEffectiveToIsNull(employeeId)
                .map(this::mapToResponse);
    }
    private SalaryProfileResponse mapToResponse(SalaryProfile entity) {
        return SalaryProfileResponse.builder()
                .profileId(entity.getProfileId())
                .employeeId(entity.getEmployeeId())
                .baseSalary(entity.getBaseSalary())
                .allowances(entity.getAllowances())
                .taxCode(entity.getTaxCode())
                .effectiveFrom(entity.getEffectiveFrom())
                .effectiveTo(entity.getEffectiveTo())
                .build();
    }
}
