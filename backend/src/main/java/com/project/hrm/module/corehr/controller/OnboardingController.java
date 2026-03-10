package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingListResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingResponseDTO;
import com.project.hrm.module.corehr.service.onboarding.IOnboardingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class OnboardingController {

    private final IOnboardingService onboardingService;

    public OnboardingController(IOnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/applications/hired")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<OnboardingListResponseDTO> getHiredApplications(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        OnboardingListResponseDTO result = onboardingService.getOnboardingList(pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/employees/new")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<NewHireResponseDTO> createEmployee(
            @Valid @RequestBody CreateNewHireDTO request) {

        NewHireResponseDTO response = onboardingService.createNewHire(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/employees/{employeeId}/edit")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<CreateNewHireDTO> getEmployeeForEdit(@PathVariable UUID employeeId) {
        CreateNewHireDTO dto = onboardingService.getEmployeeForEdit(employeeId);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/employees/{employeeId}/resubmit")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Void> resubmitRejectedEmployee(
            @PathVariable UUID employeeId,
            @Valid @RequestBody CreateNewHireDTO updatedData) {
        onboardingService.resubmitRejectedEmployee(employeeId, updatedData);
        return ResponseEntity.ok().build();
    }
}
