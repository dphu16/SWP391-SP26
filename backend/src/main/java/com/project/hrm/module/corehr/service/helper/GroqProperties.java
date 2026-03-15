package com.project.hrm.module.corehr.service.helper;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "groq.api")
public class GroqProperties {
    private String key;
    private String model;
    private String baseUrl;
    private Timeout timeout = new Timeout();

    @Data
    public static class Timeout {
        private int connect = 10;
        private int read = 60;
        private int write = 10;
    }
}