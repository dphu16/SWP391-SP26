package com.project.hrm.module.corehr.service.helper;

import com.project.hrm.module.corehr.repository.UserRepository;
import org.springframework.stereotype.Component;
import java.text.Normalizer;
import java.util.regex.Pattern;

@Component
public class UsernameGenerator {
    private static final Pattern DIACRITICS_PATTERN =
            Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private final UserRepository userRepository;

    public UsernameGenerator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String generateUnique(String fullName) {
        String base = toShortSlug(fullName);
        String candidate = base;
        int suffix = 2;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    private String toShortSlug(String fullName) {
        if (fullName == null || fullName.isBlank()) return "user";

        String ascii = removeAccent(fullName.trim());
        String[] parts = ascii.split("\\s+");
        if (parts.length == 0) return "user";

        StringBuilder sb = new StringBuilder();

        String firstName = parts[parts.length - 1].replaceAll("[^a-zA-Z0-9]", "");
        if (!firstName.isEmpty()) {
            sb.append(Character.toUpperCase(firstName.charAt(0)));
            sb.append(firstName.substring(1).toLowerCase());
        }

        for (int i = 0; i < parts.length - 1; i++) {
            String word = parts[i].replaceAll("[^a-zA-Z0-9]", "");
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0)));
            }
        }

        return sb.toString();
    }

    private String removeAccent(String str) {
        String normalized = Normalizer.normalize(str, Normalizer.Form.NFD);
        return DIACRITICS_PATTERN.matcher(normalized)
                .replaceAll("")
                .replace("đ", "d")
                .replace("Đ", "D");
    }
}
