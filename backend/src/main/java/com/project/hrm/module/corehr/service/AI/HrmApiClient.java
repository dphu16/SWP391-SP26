package com.project.hrm.module.corehr.service.AI;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;

/**
 * Chỉ chịu trách nhiệm gọi HRM internal API.
 * Mọi HTTP call đến hệ thống HRM đi qua đây.
 */
@Slf4j
@Component
public class HrmApiClient {

    private final WebClient hrmClient;

    public HrmApiClient(@Qualifier("hrmInternalClient") WebClient hrmInternalClient) {
        this.hrmClient = hrmInternalClient;
    }

    public String get(String uri, String bearer) {
        try {
            return hrmClient.get()
                    .uri(uri)
                    .header("Authorization", bearer)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
        } catch (Exception e) {
            log.error("HRM API lỗi [{}]: {}", uri, e.getMessage());
            return errorJson("Không thể lấy dữ liệu từ hệ thống.");
        }
    }

    // ── Các endpoint cụ thể ──────────────────────────────────────────────────

    public String searchEmployees(String fullName, String department, String position, int size, String bearer) {
        UriComponentsBuilder uri = UriComponentsBuilder
                .fromPath("/api/employees/search")
                .queryParam("size", size);
        if (fullName   != null) uri.queryParam("fullName",   fullName);
        if (department != null) uri.queryParam("department", department);
        if (position   != null) uri.queryParam("position",   position);
        return get(uri.build().toUriString(), bearer);
    }

    public String getEmployeeDetail(String employeeId, String bearer) {
        return get("/api/employee/" + employeeId + "/view-detail", bearer);
    }

    public String getEmployeeContracts(String employeeId, String bearer) {
        return get("/api/employees/" + employeeId + "/contracts", bearer);
    }

    public String getExpiringContracts(String bearer) {
        return get("/api/contracts/expiring", bearer);
    }

    public String getEmployeeStatistics(String bearer) {
        return get("/api/hr/employees?size=100", bearer);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String errorJson(String message) {
        return "{\"error\": \"" + message + "\"}";
    }
}
