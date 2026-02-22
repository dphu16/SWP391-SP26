package com.project.hrm.module.auth.controller;

import com.project.hrm.module.auth.dto.LoginRequest;
import com.project.hrm.module.auth.dto.LoginResponse;
import com.project.hrm.module.auth.security.JwtUtil;
import com.project.hrm.module.auth.service.customUserDetailsService;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final customUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            customUserDetailsService userDetailsService,
            UserRepository userRepository,
            EmployeeRepository employeeRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());

        // Build extra claims from the linked Employee record (if any)
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("EMPLOYEE"));

        userRepository.findByUsername(request.getUsername())
                .ifPresent(user -> employeeRepository.findByUser(user).ifPresent(employee -> {
                    claims.put("fullName", employee.getFullName());
                    claims.put("employeeId", employee.getEmployeeId().toString());
                    if (employee.getAvatarUrl() != null) {
                        claims.put("avatarUrl", employee.getAvatarUrl());
                    }
                }));

        String token = jwtUtil.generateToken(userDetails, claims);
        return ResponseEntity.ok(new LoginResponse(token));
    }
}
