package com.project.hrm.module.corehr.controller;

import com.project.hrm.module.corehr.dto.response.NotificationResponseDTO;
import com.project.hrm.module.corehr.service.helper.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications
     * Returns all notifications for the currently logged-in user.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications(Principal principal) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(principal.getName()));
    }

    /**
     * PUT /api/notifications/{id}/read
     * Marks a specific notification as read.
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id, Principal principal) {
        notificationService.markAsRead(id, principal.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/notifications/read-all
     * Marks all notifications of the current user as read.
     */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.ok().build();
    }
}
