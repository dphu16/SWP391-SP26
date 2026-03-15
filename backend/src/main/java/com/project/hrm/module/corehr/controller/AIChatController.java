package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.service.AI.AIChatService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AIChatController {

    private final AIChatService chatService;

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<Map<String, String>> chat(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "message không được để trống"));
        }

        // Lấy JWT token từ header để truyền vào HrmChatService
        String authHeader = request.getHeader("Authorization");
        String token = authHeader != null && authHeader.startsWith("Bearer ")
            ? authHeader.substring(7)
            : "";

        String answer = chatService.chat(message, token);
        return ResponseEntity.ok(Map.of("answer", answer));
    }
}
