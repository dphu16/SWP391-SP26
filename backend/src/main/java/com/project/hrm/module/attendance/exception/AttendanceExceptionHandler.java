package com.project.hrm.module.attendance.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.project.hrm.module.attendance")
public class AttendanceExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AttendanceExceptionHandler.class);

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        // Re-throw security exceptions — let Spring Security handle them (403)
        if (ex instanceof org.springframework.security.access.AccessDeniedException) {
            throw ex;
        }
        log.error("[AttendanceExceptionHandler] RuntimeException caught: {}", ex.getMessage(), ex);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateKey(DataIntegrityViolationException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("message",
                "A schedule already exists for this employee on the selected date. Use the update endpoint to change the shift.");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }
}
