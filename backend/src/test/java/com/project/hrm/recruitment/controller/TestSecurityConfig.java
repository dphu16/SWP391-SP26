package com.project.hrm.recruitment.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security config tối giản cho @WebMvcTest.
 *
 * Vì @WebMvcTest chỉ load controller layer, nó KHÔNG load
 * SecurityConfig production vốn phụ thuộc JwtAuthFilter, OAuth2, v.v.
 * TestSecurityConfig thay thế bằng một cấu hình đơn giản:
 *   - CSRF disabled (cho phép POST/PUT/DELETE trong test)
 *   - Các endpoint PUBLIC (/api/jobs/candidate/**, /cv/**) → permitAll
 *   - Còn lại → authenticated (kiểm tra @WithMockUser hoạt động đúng)
 *   - Method-level security (@PreAuthorize) vẫn được BẬT
 */
@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // ---- Public endpoints (khớp với SecurityConfig production) ----
                .requestMatchers("/api/jobs/candidate/**").permitAll()
                .requestMatchers("/api/app/candidate/**").permitAll()
                .requestMatchers("/cv/**").permitAll()
                // ---- Mọi request khác phải authenticated ----
                .anyRequest().authenticated()
            )
            // ---- Quan trọng: cần cấu hình handler để test 401/403 đúng ----
            .exceptionHandling(ex -> ex
                // Khi chưa đăng nhập → 401 (mặc định Spring sẽ redirect 302 hoặc 403)
                .authenticationEntryPoint((req, res, e) -> {
                    res.setContentType("application/json;charset=UTF-8");
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.getWriter().write("{\"error\":\"Chưa đăng nhập\"}");
                })
                // Khi đã đăng nhập nhưng thiếu quyền → 403
                .accessDeniedHandler((req, res, e) -> {
                    res.setContentType("application/json;charset=UTF-8");
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.getWriter().write("{\"error\":\"Không có quyền\"}");
                })
            );
        return http.build();
    }
}
