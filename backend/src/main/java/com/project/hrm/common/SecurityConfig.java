package com.project.hrm.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cấu hình Spring Security cho ứng dụng HRM.
 *
 * Thiết kế:
 * - Stateless session (không dùng cookie/session) → phù hợp REST API
 * - BCrypt cho mã hóa mật khẩu (strength = 10, chuẩn industry)
 * - CSRF disabled để dùng REST API stateless
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Cấu hình Security Filter Chain.
     *
     * - Các endpoint → tạm thời cho phép tất cả (sẽ bổ sung authorization sau)
     * - Session = STATELESS → server không lưu session
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // TODO: đổi thành .authenticated() khi đã implement đầy đủ
                );

        return http.build();
    }

    /**
     * Bean mã hóa mật khẩu bằng BCrypt.
     * BCrypt tự động tạo salt → cùng password cho ra hash khác nhau.
     * Strength = 10 (default) → cân bằng giữa bảo mật và performance.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Cấu hình CORS — cho phép frontend gọi API từ khác origin.
     * Trong môi trường dev, frontend chạy trên localhost:5173 (Vite).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

}
