package com.project.hrm.module.corehr.service.AI;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.module.corehr.exception.GeminiException;
import com.project.hrm.module.corehr.service.helper.GroqProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Chỉ chịu trách nhiệm gọi Groq API và trả về text response.
 * Không biết gì về business logic HRM.
 */
@Slf4j
@Component
public class GroqClient {

    private static final String PURE_JSON_SYSTEM = "Chỉ trả về JSON thuần túy, không giải thích, không markdown.";

    private final WebClient groqWebClient;
    private final GroqProperties groqProps;
    private final ObjectMapper objectMapper;

    public GroqClient(
            @Qualifier("groqWebClient") WebClient groqWebClient,
            GroqProperties groqProperties,
            ObjectMapper objectMapper) {
        this.groqWebClient = groqWebClient;
        this.groqProps     = groqProperties;
        this.objectMapper  = objectMapper;
    }

    /** Gọi Groq với system + user prompt, trả về nội dung text. */
    public String call(String systemPrompt, String userPrompt) {
        try {
            Map<String, Object> body = Map.of(
                    "model",       groqProps.getModel(),
                    "messages",    List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user",   "content", userPrompt)
                    ),
                    "temperature", 0,
                    "max_tokens",  1024,
                    "stream",      false
            );

            String raw = groqWebClient.post()
                    .uri("/v1/chat/completions")
                    .header("Authorization", "Bearer " + groqProps.getKey())
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60))
                    .retryWhen(
                            Retry.backoff(3, Duration.ofSeconds(2))
                                    .maxBackoff(Duration.ofSeconds(16))
                                    .filter(ex -> ex instanceof WebClientResponseException
                                            && ((WebClientResponseException) ex).getStatusCode().value() == 429)
                                    .doBeforeRetry(s -> log.warn("Groq 429 — retry #{}", s.totalRetries() + 1))
                    )
                    .block();

            return objectMapper.readTree(raw)
                    .path("choices").get(0)
                    .path("message")
                    .path("content").asText();

        } catch (Exception e) {
            log.error("Groq call thất bại: {}", e.getMessage());
            throw new GeminiException("Không thể kết nối AI", e);
        }
    }

    /** Shortcut cho các prompt yêu cầu trả về JSON thuần. */
    public String callForJson(String userPrompt) {
        return call(PURE_JSON_SYSTEM, userPrompt);
    }
}
