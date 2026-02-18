package com.project.hrm.module.corehr.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Xử lý exception tập trung cho toàn bộ ứng dụng.
 *
 * Thay vì mỗi controller tự try-catch, Spring sẽ tự động gọi
 * handler tương ứng dựa trên loại exception được throw.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Bắt BusinessRuleException (lỗi nghiệp vụ).
     * Trả về HTTP status phù hợp dựa trên ErrorCode:
     * - INVALID_CREDENTIALS → 401 Unauthorized
     * - ACCOUNT_LOCKED → 403 Forbidden
     * - ACCOUNT_INACTIVE → 403 Forbidden
     * - Các lỗi khác → 400 Bad Request
     */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessRuleException(BusinessRuleException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("errorCode", ex.getErrorCode().name());
        body.put("message", ex.getMessage());

        // Xác định HTTP status dựa trên loại lỗi
        HttpStatus status = switch (ex.getErrorCode()) {
            case INVALID_CREDENTIALS -> HttpStatus.UNAUTHORIZED; // 401
            case ACCOUNT_LOCKED, ACCOUNT_INACTIVE -> HttpStatus.FORBIDDEN; // 403
            default -> HttpStatus.BAD_REQUEST; // 400
        };

        return ResponseEntity.status(status).body(body);
    }

    /**
     * Bắt lỗi validation (từ @Valid + @NotNull, @NotBlank, ...).
     * Trả về danh sách các field bị lỗi.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex) {

        List<Map<String, String>> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError -> {
                    Map<String, String> error = new LinkedHashMap<>();
                    error.put("field", fieldError.getField());
                    error.put("message", fieldError.getDefaultMessage());
                    return error;
                })
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("message", "Validation failed");
        body.put("errors", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
