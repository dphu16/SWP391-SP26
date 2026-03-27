package com.project.hrm.module.corehr.service.AI;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Chỉ chịu trách nhiệm resolve tên nhân viên → employeeId.
 * Xử lý: exact match, fuzzy (bỏ dấu), ambiguous (nhiều kết quả).
 *
 * Kết quả trả về:
 *  - String employeeId  → tìm thấy đúng 1 người
 *  - "AMBIGUOUS:{json}" → nhiều người trùng tên
 *  - null               → không tìm thấy
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmployeeResolver {

    static final String AMBIGUOUS_PREFIX = "AMBIGUOUS:";

    private final HrmApiClient hrmApiClient;
    private final ObjectMapper objectMapper;

    public String resolve(String name, String department, String bearer) {
        try {
            // 1. Tìm theo tên gốc
            List<?> content = search(name, department, bearer);

            // 2. Fallback: tìm không dấu
            if (isEmpty(content)) {
                String noDiacritics = removeDiacritics(name);
                if (!noDiacritics.equals(name)) {
                    content = search(noDiacritics, department, bearer);
                }
            }

            if (isEmpty(content)) return null;

            // 3. Ưu tiên exact match (normalize cả 2 bên)
            String normalizedTarget = removeDiacritics(name).toLowerCase();
            for (Object item : content) {
                Map<?, ?> emp = (Map<?, ?>) item;
                String empName = emp.get("fullName") != null ? emp.get("fullName").toString() : "";
                if (removeDiacritics(empName).toLowerCase().equals(normalizedTarget)) {
                    return (String) emp.get("id");
                }
            }

            // 4. Nhiều kết quả, không exact → ambiguous
            if (content.size() > 1) {
                return buildAmbiguousResult(name, content);
            }

            // 5. Duy nhất 1 kết quả
            return (String) ((Map<?, ?>) content.get(0)).get("id");

        } catch (Exception e) {
            log.error("resolveEmployeeId lỗi: {}", e.getMessage());
            return null;
        }
    }

    public static boolean isAmbiguous(String result) {
        return result != null && result.startsWith(AMBIGUOUS_PREFIX);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private List<?> search(String name, String department, String bearer) throws Exception {
        String json = hrmApiClient.searchEmployees(name, department, null, 10, bearer);
        Map<?, ?> map = objectMapper.readValue(json, Map.class);
        return (List<?>) map.get("content");
    }

    private boolean isEmpty(List<?> list) {
        return list == null || list.isEmpty();
    }

    private String buildAmbiguousResult(String searchedName, List<?> content) throws Exception {
        List<Map<String, Object>> candidates = content.stream()
                .map(item -> (Map<?, ?>) item)
                .map(emp -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("fullName",   emp.get("fullName"));
                    m.put("department", emp.get("departmentName"));
                    m.put("position",   emp.get("positionName"));
                    return m;
                })
                .toList();

        String payload = objectMapper.writeValueAsString(
                Map.of("ambiguous", true, "searchedName", searchedName, "candidates", candidates)
        );
        return AMBIGUOUS_PREFIX + payload;
    }

    private String removeDiacritics(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[đĐ]", "d");
    }
}
