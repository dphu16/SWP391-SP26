package com.project.hrm.common.auth.service;

import com.project.hrm.common.auth.dto.AuthResponse;
import com.project.hrm.common.auth.dto.LoginRequest;
import com.project.hrm.common.auth.security.JwtUtil;
import com.project.hrm.module.corehr.entity.RefreshToken;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.enums.ErrorCode;
import com.project.hrm.module.corehr.repository.RefreshTokenRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepo;
    private final RefreshTokenRepository refreshTokenRepo;
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshExpiry;

    public AuthResponse login(LoginRequest req) {
        User userCheck = userRepo.findByEmail(req.getEmail()).orElse(null);
        if (userCheck != null && userCheck.getStatus() == UserStatus.INACTIVE) {
            throw new BusinessRuleException(ErrorCode.ACCOUNT_INACTIVE,
                    "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BusinessRuleException(ErrorCode.INVALID_CREDENTIALS,
                    "Email hoặc mật khẩu không chính xác.");
        } catch (Exception e) {
            log.error("Authentication error for user: {}", req.getEmail(), e);
            throw e;
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(req.getEmail());
        User user = userRepo.findByEmail(req.getEmail()).orElseThrow();
        String accessToken = jwtUtil.generateToken(userDetails, resolveDisplayName(user));
        String refreshToken = generateRefreshToken(req.getEmail());

        return new AuthResponse(accessToken, refreshToken);
    }

    public AuthResponse refresh(String refreshToken) {
        RefreshToken saved = refreshTokenRepo.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token không hợp lệ"));

        if (saved.isExpired()) {
            refreshTokenRepo.delete(saved);
            throw new RuntimeException("Phiên hết hạn, vui lòng đăng nhập lại");
        }

        String email = saved.getUser().getEmail();
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        User user = userRepo.findByEmail(email).orElseThrow();
        String newAccessToken = jwtUtil.generateToken(userDetails, resolveDisplayName(user));

        return new AuthResponse(newAccessToken, refreshToken);
    }

    public void logout(String refreshToken) {
        refreshTokenRepo.findByToken(refreshToken)
                .ifPresent(refreshTokenRepo::delete);
        SecurityContextHolder.clearContext();
    }

    private String generateRefreshToken(String email) {
        User user = userRepo.findByEmail(email).orElseThrow();
        return refreshTokenRepo.save(RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(Instant.now().plusMillis(refreshExpiry))
                .build()).getToken();
    }

    private String resolveDisplayName(User user) {
        if (user != null && user.getEmployee() != null && user.getEmployee().getFullName() != null
                && !user.getEmployee().getFullName().isBlank()) {
            return user.getEmployee().getFullName();
        }

        return user != null ? user.getEmail() : null;
    }
}
