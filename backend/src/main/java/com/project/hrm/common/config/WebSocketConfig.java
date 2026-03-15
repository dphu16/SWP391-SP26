package com.project.hrm.common.config;

import com.project.hrm.common.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Clients subscribe to /topic/* (broadcast) and /user/queue/* (private)
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        // User-specific destinations: /user/{email}/queue/notifications
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Raw WebSocket — used by the browser (native WebSocket / @stomp/stompjs)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173");

        // SockJS fallback — kept for non-browser or legacy clients
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns("http://localhost:5173")
                .withSockJS();
    }

    /**
     * Intercept the CONNECT frame to authenticate via JWT token
     * passed as a query parameter or STOMP header.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor
                        .getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authHeaders = accessor.getNativeHeader("Authorization");
                    if (authHeaders != null && !authHeaders.isEmpty()) {
                        String token = authHeaders.get(0);
                        if (token.startsWith("Bearer ")) {
                            token = token.substring(7);
                        }
                        try {
                            String email = jwtUtil.extractUsername(token);
                            if (email != null) {
                                List<String> roles = jwtUtil.extractRoles(token);
                                var authorities = roles.stream()
                                        .map(SimpleGrantedAuthority::new)
                                        .toList();
                                var auth = new UsernamePasswordAuthenticationToken(
                                        email, null, authorities);
                                accessor.setUser(auth);
                                log.debug("WebSocket CONNECT authenticated for: {}", email);
                            }
                        } catch (Exception e) {
                            log.warn("WebSocket CONNECT authentication failed: {}", e.getMessage());
                        }
                    }
                }
                return message;
            }
        });
    }
}
