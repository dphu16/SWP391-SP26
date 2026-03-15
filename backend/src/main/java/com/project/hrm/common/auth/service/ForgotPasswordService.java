package com.project.hrm.common.auth.service;

import com.project.hrm.common.auth.dto.ForgotPasswordRequest;
import com.project.hrm.common.auth.dto.ResetPasswordRequest;
import com.project.hrm.module.corehr.entity.PasswordResetToken;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.repository.PasswordResetTokenRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import com.project.hrm.module.corehr.service.helper.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordService {

    private static final long RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000L; // 30 minutes

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Initiates the forgot-password flow.
     * Always returns a generic message to prevent email enumeration.
     */
    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        userRepository.findByEmail(email).ifPresent(user -> {
            // Invalidate any existing unused reset tokens for this user
            passwordResetTokenRepository.deleteByUser(user);

            String token = UUID.randomUUID().toString();

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .user(user)
                    .expiryDate(Instant.now().plusMillis(RESET_TOKEN_EXPIRY_MS))
                    .build();

            passwordResetTokenRepository.save(resetToken);

            String userName = resolveDisplayName(user);
            emailService.sendPasswordResetEmail(email, userName, token);

            log.info("Password reset token issued for user: {}", email);
        });
    }

    /**
     * Validates the reset token and updates the user's password.
     * Sends a confirmation email after success.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.BAD_REQUEST,
                        "Invalid or expired reset token."));

        if (resetToken.isUsed()) {
            throw new BusinessRuleException(ErrorCode.BAD_REQUEST,
                    "This reset link has already been used.");
        }

        if (resetToken.isExpired()) {
            throw new BusinessRuleException(ErrorCode.BAD_REQUEST,
                    "This reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used (and clean up)
        passwordResetTokenRepository.delete(resetToken);

        String userName = resolveDisplayName(user);
        emailService.sendPasswordChangedEmail(user.getEmail(), userName);

        log.info("Password successfully reset for user: {}", user.getEmail());
    }

    private String resolveDisplayName(User user) {
        if (user != null && user.getEmployee() != null && user.getEmployee().getFullName() != null
                && !user.getEmployee().getFullName().isBlank()) {
            return user.getEmployee().getFullName();
        }

        return user != null ? user.getEmail() : null;
    }
}
