package com.aijournal.common.web;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.exception.BadRequestException;
import com.aijournal.common.exception.ForbiddenException;
import com.aijournal.common.exception.ResourceNotFoundException;
import com.aijournal.common.exception.UnauthorizedException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Ships a real, ApiResponse-shaped error response to every service that
 * depends on common-library, the same reach mechanism JwtSecurityAutoConfiguration
 * already uses (registered in AutoConfiguration.imports, since a plain
 * @Component in com.aijournal.common.* is never classpath-scanned by a
 * downstream service). Before this class existed, no @ControllerAdvice
 * existed anywhere in the repo - an unexpected exception (e.g. a null-content
 * update payload NPE-ing inside JournalEncryptionService) reached the client
 * as a raw, unstyled 500 instead of a clean, non-leaking JSON error.
 * @ConditionalOnWebApplication(type = SERVLET) mirrors the same guard
 * JwtSecurityAutoConfiguration uses, so reactive gateway-service is unaffected.
 */
@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@RestControllerAdvice
public class GlobalExceptionHandlingAutoConfiguration {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandlingAutoConfiguration.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(ForbiddenException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
    }

    // Spring Security's own exception for a failed @PreAuthorize check (e.g.
    // notification-service's ROLE_SYSTEM-gated endpoints). Without this
    // explicit handler, the catch-all below would intercept it first (MVC's
    // exception-resolver chain runs before the exception ever reaches
    // Spring Security's ExceptionTranslationFilter) and turn a real 403 into
    // a misleading 500 - found live while verifying the /send-email lockdown.
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied."));
    }

    // Spring MVC's own exception for a genuinely unmapped path (e.g. a
    // removed/renamed endpoint) - since Spring Boot 3.2, no matching handler
    // AND no matching static resource both fall through to this rather than
    // the old bare 404. Without this explicit handler, the catch-all below
    // would intercept it first and turn a real, expected 404 into a
    // misleading 500 - found live while verifying that 5 removed dead
    // pseudo-AI endpoints (ai-service) actually 404 as intended.
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("The requested resource was not found."));
    }

    // Catch-all: logs the real exception server-side but never leaks its
    // message/stack trace to the client - the specific bug this exists to
    // guard against (a null-content update NPE-ing inside the encryption
    // service) is fixed at its source too, but this is the safety net for
    // the next one nobody's found yet.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception e) {
        log.error("Unhandled exception", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please try again."));
    }
}
