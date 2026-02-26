package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingResponseDTO;
import com.project.hrm.module.corehr.service.onboarding.IOnboardingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class OnboardingController {

    private final IOnboardingService onboardingService;

    public OnboardingController(IOnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/applications/hired")
    public ResponseEntity<Page<OnboardingResponseDTO>> getHiredApplications(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        Page<OnboardingResponseDTO> result = onboardingService.getHiredApplications(pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/employees/new")
    public ResponseEntity<NewHireResponseDTO> createEmployee(
            @Valid @RequestBody CreateNewHireDTO request) {

        NewHireResponseDTO response = onboardingService.createNewHire(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
