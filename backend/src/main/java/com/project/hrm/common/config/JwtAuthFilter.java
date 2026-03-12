package com.project.hrm.common.config;

import com.project.hrm.common.auth.security.JwtUtil;
import com.project.hrm.common.auth.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = req.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        String token = header.substring(7);

        try {
            String email = jwtUtil.extractUsername(token);

            if (email != null && SecurityContextHolder.getContext()
                    .getAuthentication() == null) {
                UserDetails user = userDetailsService.loadUserByUsername(email);

                if (jwtUtil.isValid(token, user)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            user, null, user.getAuthorities());
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    // Inject claims vào request attribute
                    String employeeId = jwtUtil.extractClaim(token, claims -> claims.get("employeeId", String.class));
                    if (employeeId != null && !employeeId.isBlank()) {
                        try {
                            request.setAttribute("employeeId", java.util.UUID.fromString(employeeId));
                        } catch (IllegalArgumentException ignored) {}
                    }
                    String role = jwtUtil.extractRole(token);
                    if (role != null) {
                        request.setAttribute("role", role);
                    }
                }
            }
        } catch (Exception ignored) {
        }

        chain.doFilter(req, res);
    }
}