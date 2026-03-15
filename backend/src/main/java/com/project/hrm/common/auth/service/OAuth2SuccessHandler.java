package com.project.hrm.common.auth.service;

import com.project.hrm.common.auth.security.JwtUtil;
import com.project.hrm.module.corehr.entity.Role;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.AuthProvider;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.repository.RoleRepository;
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
import java.util.Set;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req,
            HttpServletResponse res,
            Authentication auth) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) auth.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String picture = oAuth2User.getAttribute("picture");

        User user = userRepo.findByEmail(email)
                .orElseGet(() -> createOAuthUser(email, picture));

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

    private User createOAuthUser(String email, String picture) {
        Role userRole = roleRepo.findByName(EmployeeRole.ROLE_EMPLOYEE).orElseThrow();

        return userRepo.save(User.builder()
                .email(email)
                .avatarUrl(picture)
                .provider(AuthProvider.GOOGLE)
                .status(UserStatus.ACTIVE)
                .roles(Set.of(userRole))
                .build());
    }

    private String resolveDisplayName(User user) {
        if (user != null && user.getEmployee() != null && user.getEmployee().getFullName() != null
                && !user.getEmployee().getFullName().isBlank()) {
            return user.getEmployee().getFullName();
        }

        return user != null ? user.getEmail() : null;
    }
}