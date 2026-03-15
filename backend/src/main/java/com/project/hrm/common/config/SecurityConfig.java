package com.project.hrm.common.config;

import com.project.hrm.common.auth.service.CustomUserDetailsService;
import com.project.hrm.common.auth.service.OAuth2SuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;
        private final OAuth2SuccessHandler oAuth2SuccessHandler;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http, DaoAuthenticationProvider authenticationProvider)
                        throws Exception {
                http
                                .authenticationProvider(authenticationProvider)
                        .cors(cors -> {}) //Có thể xóa
                        .csrf(csrf -> csrf.disable())
                        .headers(headers -> headers  //Có thể xóa
                                .frameOptions(frame -> frame.disable())  //Có thể xóa
                        )   //Có thể xóa
                                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/api/activation/verify").permitAll()
                                                .requestMatchers("/api/activation/set-password").permitAll()
                                                .requestMatchers("/api/activation/emergency-contact").permitAll()
                                                .requestMatchers("/api/activation/bank-account").permitAll()
                                                .requestMatchers("/api/files/download/**").permitAll()
                                                .requestMatchers("/oauth2/**").permitAll()
                                                .requestMatchers("/api/jobs/candidate/**").permitAll()
                                                .requestMatchers("/api/app/candidate/**").permitAll()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers("/cv/**").permitAll()

                                                .anyRequest().authenticated())

                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                                .oauth2Login(oauth -> oauth
                                                .authorizationEndpoint(e -> e.baseUri("/oauth2/authorize"))
                                                .successHandler(oAuth2SuccessHandler))

                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((req, res, e) -> {
                                                        res.setContentType("application/json;charset=UTF-8");
                                                        res.setStatus(401);
                                                        res.getWriter().write(
                                                                        "{\"error\":\"Chưa đăng nhập hoặc token hết hạn\"}");
                                                })
                                                .accessDeniedHandler((req, res, e) -> {
                                                        res.setContentType("application/json;charset=UTF-8");
                                                        res.setStatus(403);
                                                        res.getWriter().write(
                                                                        "{\"error\":\"Bạn không có quyền thực hiện hành động này\"}");
                                                }));

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(12);
        }

        @Bean
        public AuthenticationManager authManager(AuthenticationConfiguration config)
                        throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider(CustomUserDetailsService userDetailsService) {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
                provider.setUserDetailsService(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder());
                return provider;
        }
}