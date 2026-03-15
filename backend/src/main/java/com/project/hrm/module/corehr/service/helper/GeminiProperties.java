package com.project.hrm.module.corehr.service.helper;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "gemini.api")
public class GeminiProperties {

    private String key;
    private String model;
    private String baseUrl;
    private Timeout timeout = new Timeout();

    @Data
    public static class Timeout {
        private int connect = 5;
        private int read = 90;
        private int write = 30;
    }
}