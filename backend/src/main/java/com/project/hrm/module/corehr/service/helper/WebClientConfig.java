package com.project.hrm.module.corehr.service.helper;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class WebClientConfig {

    private final GeminiProperties GeminiProperties;
    private final GroqProperties groqProperties;

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean("geminiWebClient")
    public WebClient geminiWebClient() {
        GeminiProperties.Timeout t = GeminiProperties.getTimeout();
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, t.getConnect() * 1000)
                .responseTimeout(Duration.ofSeconds(t.getRead()))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(t.getRead(), TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(t.getWrite(), TimeUnit.SECONDS))
                );
        return WebClient.builder()
                .baseUrl(GeminiProperties.getBaseUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .codecs(config -> config.defaultCodecs().maxInMemorySize(20 * 1024 * 1024))
                .filter(logRequest("Gemini"))
                .filter(logResponse("Gemini"))
                .build();
    }

    @Bean("groqWebClient")
    public WebClient groqWebClient() {
        GroqProperties.Timeout t = groqProperties.getTimeout();
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, t.getConnect() * 1000)
                .responseTimeout(Duration.ofSeconds(t.getRead()))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(t.getRead(), TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(t.getWrite(), TimeUnit.SECONDS))
                );
        return WebClient.builder()
                .baseUrl(groqProperties.getBaseUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .codecs(config -> config.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .filter(logRequest("Groq"))
                .filter(logResponse("Groq"))
                .build();
    }

    @Bean("hrmInternalClient")
    public WebClient hrmInternalClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:" + serverPort)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .codecs(config -> config.defaultCodecs().maxInMemorySize(5 * 1024 * 1024))
                .build();
    }

    private ExchangeFilterFunction logRequest(String label) {
        return ExchangeFilterFunction.ofRequestProcessor(req -> {
            log.debug("{} → {} {}", label, req.method(), req.url());
            return Mono.just(req);
        });
    }

    private ExchangeFilterFunction logResponse(String label) {
        return ExchangeFilterFunction.ofResponseProcessor(res -> {
            log.debug("{} ← {}", label, res.statusCode());
            return Mono.just(res);
        });
    }
}