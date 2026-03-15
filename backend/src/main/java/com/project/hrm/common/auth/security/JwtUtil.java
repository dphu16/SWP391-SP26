package com.project.hrm.common.auth.security;


import com.project.hrm.module.corehr.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;


@Component
public class JwtUtil {

    @Value("${app.jwt.secret-key}")
    private String secret;

    @Value("${app.jwt.access-token-expiry}")
    private long expirationMs;

    private final UserRepository userRepository;

    public JwtUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private SecretKey key() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(userDetails, null);
    }

    public String generateToken(UserDetails userDetails, com.project.hrm.module.corehr.entity.User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities()
                .stream().map(GrantedAuthority::getAuthority).toList());

        if (user != null) {
            if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
                claims.put("fullName", user.getFullName());
            }
            if (user.getRole() != null) {
                claims.put("role", user.getRole().name().replace("ROLE_", ""));
            }
            if (user.getAvatarUrl() != null && !user.getAvatarUrl().trim().isEmpty()) {
                claims.put("avatarUrl", user.getAvatarUrl());
            }
            if (user.getEmployee() != null && user.getEmployee().getEmployeeId() != null) {
                claims.put("employeeId", user.getEmployee().getEmployeeId().toString());
            }
        }

        // Add employeeId to JWT directly from User table
        // Đoạn code đã sửa
        userRepository.findByEmail(userDetails.getUsername())
                .filter(u -> u.getEmployee() != null && u.getEmployee().getEmployeeId() != null)
                .ifPresent(u -> claims.put("employeeId", u.getEmployee().getEmployeeId().toString()));

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(
                        System.currentTimeMillis() + expirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Extract the employeeId claim embedded in the token (maybe null for users
     * without employee records).
     */
    public String extractEmployeeId(String token) {
        Object empId = parseClaims(token).get("employeeId");
        return empId != null ? empId.toString() : null;
    }

    public boolean isValid(String token, UserDetails userDetails) {
        return extractUsername(token).equals(userDetails.getUsername())
                && !isExpired(token);
    }

    private boolean isExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
