package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.EmployeeActivationToken;
import com.project.hrm.module.corehr.entity.Role;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.mapper.EmployeeDetailMapper;
import com.project.hrm.module.corehr.repository.ActivationTokenRepository;
import com.project.hrm.module.corehr.repository.RoleRepository;
import com.project.hrm.module.corehr.service.helper.EmailService;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class EmployeeCommandService {
    private final EmployeeHelper employeeHelper;
    private final RoleRepository roleRepository;
    private final ActivationTokenRepository activationTokenRepo;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public EmployeeCommandService(EmployeeHelper employeeHelper,
                                  RoleRepository roleRepository,
                                  ActivationTokenRepository activationTokenRepo,
                                  EmailService emailService) {
        this.employeeHelper = employeeHelper;
        this.roleRepository = roleRepository;
        this.activationTokenRepo = activationTokenRepo;
        this.emailService = emailService;
    }

    /**
     * Checks whether the email in the request is different from the current email.
     * Compares against both User.email and Personal.email.
     */
    private boolean isEmailChanged(Employee e, EmployeeChangeDTO req) {
        if (req.getEmail() == null) return false;
        String newEmail = req.getEmail().trim();

        // Compare with current User email (login email)
        if (e.getUser() != null && e.getUser().getEmail() != null) {
            if (!newEmail.equalsIgnoreCase(e.getUser().getEmail())) {
                return true;
            }
        }

        // Compare with current Personal email
        if (e.getPersonal() != null && e.getPersonal().getEmail() != null) {
            if (!newEmail.equalsIgnoreCase(e.getPersonal().getEmail())) {
                return true;
            }
        }

        return false;
    }

    private void applyPersonalInfo(Employee e, EmployeeChangeDTO req) {
        if (req.getFullName() != null)
            e.setFullName(req.getFullName());
        if (req.getEmail() != null) {
            e.getPersonal().setEmail(req.getEmail());
            // Also update login email on User entity
            if (e.getUser() != null) {
                e.getUser().setEmail(req.getEmail());
            }
        }
        if (req.getPhone() != null)
            e.getPersonal().setPhone(req.getPhone());
        if (req.getAddress() != null)
            e.getPersonal().setAddress(req.getAddress());
        if (req.getGender() != null)
            e.getPersonal().setGender(req.getGender());
        if (req.getCitizenId() != null)
            e.getPersonal().setCitizenId(req.getCitizenId());
        if (req.getTaxCode() != null)
            e.getPersonal().setTaxCode(req.getTaxCode());
        if (req.getDateOfBirth() != null)
            e.getPersonal().setDateOfBirth(req.getDateOfBirth());
        if (req.getDateOfJoining() != null)
            e.setDateOfJoining(req.getDateOfJoining());
        if (req.getAvatarUrl() != null)
            e.getPersonal().setAvatar(req.getAvatarUrl());
    }

    private void applyJobInfo(Employee e, EmployeeChangeDTO req) {
        if (req.getDepartmentId() != null) {
            e.setDepartment(employeeHelper.findDepartmentOrThrow(req.getDepartmentId()));
        }
        if (req.getPositionId() != null) {
            e.setPosition(employeeHelper.findPositionOrThrow(req.getPositionId()));
        }
        if (req.getEmpStatus() != null)
            e.setStatus(req.getEmpStatus());
    }

    private void applyUserAccount(Employee e, EmployeeChangeDTO req) {
        if (e.getUser() == null)
            return;

        if (req.getRole() != null) {
            Role role = roleRepository.findByName(req.getRole())
                    .orElseThrow(() -> new RuntimeException("Role không tồn tại"));
            e.getUser().setRoles(Set.of(role));
        }

        if (req.getEmpStatus() != null) {
            UserStatus userStatus = switch (req.getEmpStatus()) {
                case OFFICIAL, INTERN, PROBATION -> UserStatus.ACTIVE;
                case TERMINATED, RESIGNED -> UserStatus.INACTIVE;
                default -> UserStatus.INACTIVE;
            };
            e.getUser().setStatus(userStatus);
        }
    }

    /**
     * Sends a verification email to the new email address.
     * Reuses the existing activation token and email template infrastructure.
     */
    private void sendEmailVerification(Employee e) {
        String newEmail = e.getUser() != null ? e.getUser().getEmail() : e.getPersonal().getEmail();
        if (newEmail == null || newEmail.isBlank()) return;

        // Invalidate any previous unused tokens for this employee
        activationTokenRepo.findByEmployee_EmployeeIdAndUsedFalse(e.getEmployeeId())
                .ifPresent(existingToken -> {
                    existingToken.setUsed(true);
                    existingToken.setUsedAt(OffsetDateTime.now());
                    activationTokenRepo.save(existingToken);
                });

        // Generate a new secure token
        String tokenValue = generateSecureToken();

        EmployeeActivationToken activationToken = EmployeeActivationToken.builder()
                .token(tokenValue)
                .employee(e)
                .used(false)
                .build();
        activationTokenRepo.save(activationToken);

        // Send verification email asynchronously using existing email template
        emailService.sendActivationEmail(newEmail, e.getFullName(), tokenValue);

        log.info("Email changed for employee: {} ({}). Verification email sent to: {}",
                e.getFullName(), e.getEmployeeId(), newEmail);
    }

    private String generateSecureToken() {
        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    @Transactional
    public EmployeeDetailDTO updateEmployee(UUID id, EmployeeChangeDTO req) {
        Employee e = employeeHelper.findEmployeeOrThrow(id);

        // Detect email change BEFORE applying updates
        boolean emailChanged = isEmailChanged(e, req);

        applyPersonalInfo(e, req);
        applyJobInfo(e, req);
        applyUserAccount(e, req);

        Employee saved = employeeHelper.save(e);

        // If email was changed, send verification email to the new address
        if (emailChanged) {
            sendEmailVerification(saved);
        }

        return EmployeeDetailMapper.toDTO(saved);
    }
}
