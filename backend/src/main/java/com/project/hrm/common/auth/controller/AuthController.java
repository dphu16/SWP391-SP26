package com.project.hrm.common.auth.controller;

import com.project.hrm.common.auth.dto.LoginRequest;
import com.project.hrm.common.auth.dto.LoginResponse;
import com.project.hrm.common.auth.security.JwtUtil;
import com.project.hrm.common.auth.service.CustomUserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
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
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            CustomUserDetailsService userDetailsService,
            UserRepository userRepository,
            EmployeeRepository employeeRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BusinessRuleException(ErrorCode.INVALID_CREDENTIALS,
                    "Invalid username or password");
        } catch (DisabledException e) {
            throw new BusinessRuleException(ErrorCode.ACCOUNT_INACTIVE,
                    "Account is inactive. Please contact HR.");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("EMPLOYEE"));

        userRepository.findByUsername(request.getUsername())
                .ifPresent(user -> employeeRepository.findByUser(user).ifPresent(employee -> {
                    if (employee.getFullName() != null) {
                        claims.put("fullName", employee.getFullName());
                    }
                    if (employee.getPersonal() != null) {
                        if (employee.getPersonal().getAvatar() != null) {
                            claims.put("avatarUrl", employee.getPersonal().getAvatar());
                        }
                    }
                    claims.put("employeeId", employee.getEmployeeId().toString());
                }));

        String token = jwtUtil.generateToken(userDetails, claims);
        return ResponseEntity.ok(new LoginResponse(token));
    }
}
