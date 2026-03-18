package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.request.BankAccountDTO;
import com.project.hrm.module.corehr.dto.request.EmergencyContactDTO;
import com.project.hrm.module.corehr.dto.request.SetPasswordDTO;
import com.project.hrm.module.corehr.dto.response.ActivationResponseDTO;
import com.project.hrm.module.corehr.service.onboarding.ActivationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/activation")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ActivationController {

    private final ActivationService activationService;

    @PostMapping("/send/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Map<String, String>> sendActivationEmail(@PathVariable("employeeId") UUID employeeId) {
        activationService.sendActivationEmail(employeeId);
        return ResponseEntity.ok(Map.of("message", "Activation email sent successfully"));
    }

    @GetMapping("/verify")
    public ResponseEntity<ActivationResponseDTO> verifyToken(
            @RequestParam(name = "token") String token) {
        return ResponseEntity.ok(activationService.verifyActivationToken(token));
    }

    @PostMapping("/set-password")
    public ResponseEntity<ActivationResponseDTO> setPassword(
            @Valid @RequestBody SetPasswordDTO dto) {
        return ResponseEntity.ok(activationService.setPassword(dto));
    }

    @PostMapping("/emergency-contact")
    public ResponseEntity<ActivationResponseDTO> submitEmergencyContact(
            @RequestParam(name = "token") String token,
            @Valid @RequestBody EmergencyContactDTO dto) {
        return ResponseEntity.ok(activationService.submitEmergencyContact(token, dto));
    }

    @PostMapping("/bank-account")
    public ResponseEntity<ActivationResponseDTO> submitBankAccount(
            @RequestParam(name = "token") String token,
            @Valid @RequestBody BankAccountDTO dto) {
        return ResponseEntity.ok(activationService.submitBankAccountAndActivate(token, dto));
    }
}
