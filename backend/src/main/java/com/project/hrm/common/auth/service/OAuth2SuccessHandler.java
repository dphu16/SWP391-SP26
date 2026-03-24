package com.project.hrm.common.auth.service;

import com.project.hrm.common.auth.security.JwtUtil;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.AuthProvider;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req,
            HttpServletResponse res,
            Authentication auth) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) auth.getPrincipal();

        String rawEmail = oAuth2User.getAttribute("email");
        String email = (rawEmail != null) ? rawEmail.toLowerCase().trim() : null;
        String picture = oAuth2User.getAttribute("picture");

        User user = userRepo.findByEmail(email)
                .map(existingUser -> updateOAuthInfo(existingUser, picture))
                .orElse(null);

        if (user == null) {
            String redirectUrl = frontendUrl + "/login?error=account_not_found";
            getRedirectStrategy().sendRedirect(req, res, redirectUrl);
            return;
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            String redirectUrl = frontendUrl + "/login?error=account_inactive";
            getRedirectStrategy().sendRedirect(req, res, redirectUrl);
            return;
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails, resolveDisplayName(user));

        String redirectUrl = frontendUrl + "/oauth2/callback?token=" + token;
        getRedirectStrategy().sendRedirect(req, res, redirectUrl);
    }

    private User updateOAuthInfo(User user, String picture) {
        boolean changed = false;

        // Cập nhật provider nếu chưa phải GOOGLE
        if (user.getProvider() != AuthProvider.GOOGLE) {
            user.setProvider(AuthProvider.GOOGLE);
            changed = true;
        }

        // Cập nhật avatar nếu chưa có hoặc muốn sync từ Google
        if (picture != null && !picture.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(picture);
            changed = true;
        }

        return changed ? userRepo.save(user) : user;
    }

    private String resolveDisplayName(User user) {
        if (user != null && user.getEmployee() != null && user.getEmployee().getFullName() != null
                && !user.getEmployee().getFullName().isBlank()) {
            return user.getEmployee().getFullName();
        }

        return user != null ? user.getEmail() : null;
    }
}