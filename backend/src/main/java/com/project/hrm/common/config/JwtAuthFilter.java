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
import java.util.UUID;

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

                    // Extract employeeId from JWT claims and set as request attribute
                    // so that payroll controllers can use @RequestAttribute("employeeId")
                    try {
                        String empId = jwtUtil.extractEmployeeId(token);
                        if (empId != null && !empId.isBlank()) {
                            req.setAttribute("employeeId", UUID.fromString(empId));
                        }
                    } catch (Exception ignored) {
                        // employeeId is optional (e.g. Admin/HR may not have one)
                    }
                }
            }
        } catch (Exception ignored) {
        }

        chain.doFilter(req, res);
    }
}