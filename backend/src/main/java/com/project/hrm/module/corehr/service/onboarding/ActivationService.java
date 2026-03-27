package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.BankAccountDTO;
import com.project.hrm.module.corehr.dto.request.EmergencyContactDTO;
import com.project.hrm.module.corehr.dto.request.SetPasswordDTO;
import com.project.hrm.module.corehr.dto.response.ActivationResponseDTO;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.enums.ErrorCode;
import com.project.hrm.module.corehr.repository.*;
import com.project.hrm.module.corehr.service.helper.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivationService {

        private final ActivationTokenRepository activationTokenRepo;
        private final EmployeeRepository employeeRepo;
        private final UserRepository userRepo;
        private final BankAccountRepository bankAccountRepo;
        private final DependentRepository emergencyContactRepo;
        private final PasswordEncoder passwordEncoder;
        private final EmailService emailService;

        private static final SecureRandom SECURE_RANDOM = new SecureRandom();

        // ─────────────────────────────────────────────────────────────
        // API 1: Send Activation Email
        // Called when employee status transitions to APPROVAL
        // ─────────────────────────────────────────────────────────────
        @Transactional
        public void sendActivationEmail(UUID employeeId) {
                Employee employee = employeeRepo.findById(employeeId)
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.EMPLOYEE_NOT_FOUND,
                                                "Employee not found with id: " + employeeId));

                User user = employee.getUser();
                if (user == null && employee.getPersonal() != null && employee.getPersonal().getEmail() != null) {
                        String email = employee.getPersonal().getEmail();
                        user = userRepo.findByEmail(email).orElse(null);

                        if (user != null && user.getEmployee() == null) {
                                user.setEmployee(employee);
                                userRepo.save(user);
                                employee.setUser(user);
                        }
                }

                if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
                        throw new BusinessRuleException(
                                        ErrorCode.ACTIVATION_NO_USER_ACCOUNT,
                                        "Employee does not have an associated user account with email");
                }

                // Invalidate any previous unused tokens for this employee
                activationTokenRepo.findByEmployee_EmployeeIdAndUsedFalse(employeeId)
                                .ifPresent(existingToken -> {
                                        existingToken.setUsed(true);
                                        existingToken.setUsedAt(OffsetDateTime.now());
                                        activationTokenRepo.save(existingToken);
                                });

                // Generate a cryptographically secure token
                String tokenValue = generateSecureToken();

                EmployeeActivationToken activationToken = EmployeeActivationToken.builder()
                                .token(tokenValue)
                                .employee(employee)
                                .used(false)
                                .build();
                activationTokenRepo.save(activationToken);

                // Update employee status to PENDING_ACTIVATION
                employee.setEmpStatus(ProgressStatus.PENDING_ACTIVATION);
                employeeRepo.save(employee);

                // Send email asynchronously
                emailService.sendActivationEmail(user.getEmail(), employee.getFullName(), tokenValue);

                log.info("Activation token created and email queued for employee: {} ({})",
                                employee.getFullName(), employeeId);
        }

        // ─────────────────────────────────────────────────────────────
        // API 2: Verify Activation Token
        // Employee clicks the link → frontend calls this to validate token
        // ─────────────────────────────────────────────────────────────
        @Transactional(readOnly = true)
        public ActivationResponseDTO verifyActivationToken(String token) {
                EmployeeActivationToken activationToken = activationTokenRepo
                                .findByTokenAndUsedFalse(token)
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.ACTIVATION_TOKEN_INVALID,
                                                "Activation token is invalid or has already been used"));

                Employee employee = activationToken.getEmployee();
                User user = employee.getUser();

                return ActivationResponseDTO.builder()
                                .message("Token is valid")
                                .employeeName(employee.getFullName())
                                .email(user != null ? user.getEmail() : null)
                                .employeeId(employee.getEmployeeId())
                                .currentStep(employee.getEmpStatus().name())
                                .build();
        }

        // ─────────────────────────────────────────────────────────────
        // API 3: Set Password (first-time password setup)
        // ─────────────────────────────────────────────────────────────
        @Transactional
        public ActivationResponseDTO setPassword(SetPasswordDTO dto) {
                EmployeeActivationToken activationToken = activationTokenRepo
                                .findByTokenAndUsedFalse(dto.getActivationToken())
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.ACTIVATION_TOKEN_INVALID,
                                                "Activation token is invalid or has already been used"));

                Employee employee = activationToken.getEmployee();
                User user = employee.getUser();

                if (user == null) {
                        throw new BusinessRuleException(
                                        ErrorCode.ACTIVATION_NO_USER_ACCOUNT,
                                        "Employee does not have an associated user account");
                }

                // Hash and save the new password
                user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
                userRepo.save(user);

                // Transition: PENDING_ACTIVATION → PASSWORD_CREATED
                employee.setEmpStatus(ProgressStatus.PASSWORD_CREATED);
                employeeRepo.save(employee);

                log.info("Password set for employee: {} ({})", employee.getFullName(), employee.getEmployeeId());

                return ActivationResponseDTO.builder()
                                .message("Password set successfully. Please complete your profile.")
                                .employeeName(employee.getFullName())
                                .email(user.getEmail())
                                .employeeId(employee.getEmployeeId())
                                .currentStep(ProgressStatus.PASSWORD_CREATED.name())
                                .build();
        }

        // ─────────────────────────────────────────────────────────────
        // API 4: Submit Emergency Contact
        // ─────────────────────────────────────────────────────────────
        @Transactional
        public ActivationResponseDTO submitEmergencyContact(String token, EmergencyContactDTO dto) {
                EmployeeActivationToken activationToken = activationTokenRepo
                                .findByTokenAndUsedFalse(token)
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.ACTIVATION_TOKEN_INVALID,
                                                "Activation token is invalid or has already been used"));

                Employee employee = activationToken.getEmployee();

                // Upsert emergency contact
                Dependent contact = emergencyContactRepo
                                .findByEmployee_EmployeeId(employee.getEmployeeId())
                                .orElse(Dependent.builder().employee(employee).build());

                contact.setContactName(dto.getContactName());
                contact.setRelationship(dto.getRelationship());
                contact.setPhone(dto.getPhone());
                contact.setAddress(dto.getAddress());
                emergencyContactRepo.save(contact);

                // Transition: PASSWORD_CREATED → COMPLETED
                employee.setEmpStatus(ProgressStatus.COMPLETED);
                employee.getUser().setStatus(UserStatus.ACTIVE);
                employeeRepo.save(employee);

                log.info("Emergency contact saved for employee: {} ({})",
                                employee.getFullName(), employee.getEmployeeId());

                return ActivationResponseDTO.builder()
                                .message("Emergency contact saved successfully")
                                .employeeName(employee.getFullName())
                                .employeeId(employee.getEmployeeId())
                                .currentStep(ProgressStatus.COMPLETED.name())
                                .build();
        }

        // ─────────────────────────────────────────────────────────────
        // API 5: Submit Bank Account + Finalize Activation
        // This is the LAST step → activates the account
        // ─────────────────────────────────────────────────────────────
        @Transactional
        public ActivationResponseDTO submitBankAccountAndActivate(String token, BankAccountDTO dto) {
                EmployeeActivationToken activationToken = activationTokenRepo
                                .findByTokenAndUsedFalse(token)
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.ACTIVATION_TOKEN_INVALID,
                                                "Activation token is invalid or has already been used"));

                Employee employee = activationToken.getEmployee();
                User user = employee.getUser();

                if (user == null) {
                        throw new BusinessRuleException(
                                        ErrorCode.ACTIVATION_NO_USER_ACCOUNT,
                                        "Employee does not have an associated user account");
                }

                // Save bank account info
                BankAccount bankAccount = bankAccountRepo
                                .findByEmployee_EmployeeId(employee.getEmployeeId())
                                .orElse(BankAccount.builder().employee(employee).build());

                bankAccount.setAccountNumber(dto.getAccountNumber());
                bankAccount.setBankName(dto.getBankName());
                bankAccount.setBranchName(dto.getBranchName());
                bankAccount.setAccountHolderName(dto.getAccountHolderName());
                bankAccountRepo.save(bankAccount);

                // Transition: PASSWORD_CREATED → targetStatus (OFFICIAL / INTERN / PROBATION)
                EmployeeStatus finalStatus = employee.getStatus();
                if (finalStatus == null) {
                        finalStatus = EmployeeStatus.OFFICIAL;
                }
                employee.setStatus(finalStatus);
                employeeRepo.save(employee);

                // Activate user account → allow login immediately
                user.setStatus(UserStatus.ACTIVE);
                userRepo.save(user);

                // Invalidate the activation token (one-time use)
                activationToken.setUsed(true);
                activationToken.setUsedAt(OffsetDateTime.now());
                activationTokenRepo.save(activationToken);

                log.info("Account fully activated for employee: {} ({})",
                                employee.getFullName(), employee.getEmployeeId());



                return ActivationResponseDTO.builder()
                                .message("Account activated successfully. You can now log in.")
                                .employeeName(employee.getFullName())
                                .email(user.getEmail())
                                .employeeId(employee.getEmployeeId())
                                .currentStep(employee.getEmpStatus().name())
                                .build();
        }

        // ─────────────────────────────────────────────────────────────
        // API 6: Upload Avatar
        // ─────────────────────────────────────────────────────────────
        @Transactional
        public String uploadAvatar(String token, MultipartFile file) {
                EmployeeActivationToken activationToken = activationTokenRepo
                                .findByTokenAndUsedFalse(token)
                                .orElseThrow(() -> new BusinessRuleException(
                                                ErrorCode.ACTIVATION_TOKEN_INVALID,
                                                "Activation token is invalid or has already been used"));

                Employee employee = activationToken.getEmployee();
                User user = employee.getUser();

                if (user == null) {
                        throw new BusinessRuleException(
                                        ErrorCode.ACTIVATION_NO_USER_ACCOUNT,
                                        "Employee does not have an associated user account");
                }

                if (file.isEmpty()) {
                        throw new BusinessRuleException(ErrorCode.BAD_REQUEST, "File is empty");
                }

                // File size validation (max 2MB)
                if (file.getSize() > 2 * 1024 * 1024) {
                        throw new BusinessRuleException(ErrorCode.BAD_REQUEST, "File size exceeds limit of 2MB");
                }

                // File type validation
                String contentType = file.getContentType();
                List<String> allowedTypes = List.of("image/jpeg", "image/png", "image/jpg");
                if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
                        throw new BusinessRuleException(ErrorCode.BAD_REQUEST, "Only JPG, JPEG, and PNG formats are allowed");
                }

                try {
                        String uploadDir = "uploads/avatars/";
                        Path uploadPath = Paths.get(uploadDir);

                        if (!Files.exists(uploadPath)) {
                                Files.createDirectories(uploadPath);
                        }

                        // Generate unique file name
                        String originalFilename = file.getOriginalFilename();
                        String extension = "";
                        if (originalFilename != null && originalFilename.lastIndexOf(".") != -1) {
                                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                        }
                        String fileName = UUID.randomUUID().toString() + extension;

                        Path filePath = uploadPath.resolve(fileName);
                        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                        // Save the avatarUrl to the path that can be served by the web config
                        String avatarUrl = "/avatars/" + fileName;
                        user.setAvatarUrl(avatarUrl);
                        userRepo.save(user);

                        // Also update personal info if it exists
                        if (employee.getPersonal() != null) {
                                employee.getPersonal().setAvatar(avatarUrl);
                        }
                        employeeRepo.save(employee);

                        log.info("Avatar uploaded successfully for employee: {} ({})", employee.getFullName(), employee.getEmployeeId());

                        return avatarUrl;
                } catch (Exception e) {
                        log.error("Failed to upload avatar", e);
                        throw new RuntimeException("Failed to save avatar file to the server");
                }
        }

        // ─────────────────────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────────────────────

        private String generateSecureToken() {
                byte[] tokenBytes = new byte[32];
                SECURE_RANDOM.nextBytes(tokenBytes);
                return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        }

        @Transactional
        public String createDebugToken(String email) {
                User user = userRepo.findByEmail(email)
                                .orElseThrow(() -> new BusinessRuleException(ErrorCode.USER_NOT_FOUND, "User not found"));

                Employee employee = user.getEmployee();
                if (employee == null) {
                        throw new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND, "User has no associated employee profile");
                }

                // Invalidate existing activation tokens for this employee
                activationTokenRepo.findByEmployee_EmployeeIdAndUsedFalse(employee.getEmployeeId())
                                .ifPresent(t -> {
                                        t.setUsed(true);
                                        activationTokenRepo.save(t);
                                });

                String tokenValue = "test-token-" + UUID.randomUUID().toString().substring(0, 8);
                EmployeeActivationToken token = EmployeeActivationToken.builder()
                                .token(tokenValue)
                                .employee(employee)
                                .used(false)
                                .build();
                activationTokenRepo.save(token);

                // Reset status to allow starting from step 1
                employee.setEmpStatus(ProgressStatus.PENDING_ACTIVATION);
                employeeRepo.save(employee);

                return tokenValue;
        }

}
