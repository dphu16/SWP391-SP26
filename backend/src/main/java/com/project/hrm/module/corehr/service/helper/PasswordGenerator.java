package com.project.hrm.module.corehr.service.helper;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class PasswordGenerator {
    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    private static final int LENGTH = 12;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generate() {
        StringBuilder sb = new StringBuilder(LENGTH);

        // Đảm bảo mỗi loại ký tự đều có mặt
        sb.append(CHARS.charAt(RANDOM.nextInt(26)));
        sb.append(CHARS.charAt(26 + RANDOM.nextInt(26)));
        sb.append(CHARS.charAt(52 + RANDOM.nextInt(10)));
        sb.append(CHARS.charAt(62 + RANDOM.nextInt(CHARS.length() - 62)));

        // Fill phần còn lại
        for (int i = 4; i < LENGTH; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }

        return shuffle(sb.toString());
    }

    private String shuffle(String input) {
        char[] chars = input.toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }
        return new String(chars);
    }
}
