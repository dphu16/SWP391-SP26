package com.project.hrm;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "123456";
        String encoded = encoder.encode(rawPassword);
        System.out.println("=== BCRYPT HASH RESULT ===");
        System.out.println("Password: " + rawPassword);
        System.out.println("BCrypt Hash: " + encoded);
        System.out.println("Verify: " + encoder.matches(rawPassword, encoded));
        System.out.println("=== END ===");
    }
}
