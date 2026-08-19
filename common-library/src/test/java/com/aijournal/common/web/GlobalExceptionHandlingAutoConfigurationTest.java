package com.aijournal.common.web;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.exception.BadRequestException;
import com.aijournal.common.exception.ForbiddenException;
import com.aijournal.common.exception.ResourceNotFoundException;
import com.aijournal.common.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlingAutoConfigurationTest {

    private final GlobalExceptionHandlingAutoConfiguration handler = new GlobalExceptionHandlingAutoConfiguration();

    @Test
    void handleNotFound_ReturnsFourOhFourWithApiResponseEnvelope() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleNotFound(new ResourceNotFoundException("Journal", "id", 1L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Journal");
    }

    @Test
    void handleBadRequest_ReturnsFourHundred() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleBadRequest(new BadRequestException("bad input"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo("bad input");
    }

    @Test
    void handleUnauthorized_ReturnsFourOhOne() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleUnauthorized(new UnauthorizedException("nope"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void handleForbidden_ReturnsFourOhThree() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleForbidden(new ForbiddenException("nope"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void handleAccessDenied_ReturnsFourOhThree_NotSwallowedByTheCatchAll() {
        // Regression guard: found live while verifying notification-service's
        // ROLE_SYSTEM lockdown - without an explicit handler here, the
        // catch-all @ExceptionHandler(Exception.class) intercepted Spring
        // Security's AccessDeniedException first and turned a real 403 into
        // a misleading 500.
        ResponseEntity<ApiResponse<Void>> response = handler.handleAccessDenied(new AccessDeniedException("Access is denied"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().isSuccess()).isFalse();
    }

    @Test
    void handleNoResourceFound_ReturnsFourOhFour_NotSwallowedByTheCatchAll() {
        // Regression guard: found live while verifying that 5 removed dead
        // pseudo-AI endpoints (ai-service) actually 404 as intended - without
        // an explicit handler here, the catch-all @ExceptionHandler(Exception.class)
        // intercepted Spring MVC's own NoResourceFoundException (the real
        // Spring Boot 3.2+ replacement for "no handler found") first and
        // turned a real, expected 404 into a misleading 500.
        ResponseEntity<ApiResponse<Void>> response = handler.handleNoResourceFound(
                new NoResourceFoundException(HttpMethod.POST, "api/v1/ai/habits"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().isSuccess()).isFalse();
    }

    @Test
    void handleValidation_ReturnsFourHundredWithFieldMessages_NotSwallowedByTheCatchAll() {
        // Regression guard: found live while verifying the auth-service
        // password-policy @Pattern - without an explicit handler here, the
        // catch-all @ExceptionHandler(Exception.class) intercepted Spring's
        // own @Valid failure first and turned a clean, actionable validation
        // error into a misleading, unhelpful 500.
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "registerRequest");
        bindingResult.addError(new FieldError("registerRequest", "password", "Password must be 8-12 characters and include at least one uppercase letter, one number, and one special character"));
        MethodArgumentNotValidException exception = new MethodArgumentNotValidException((org.springframework.core.MethodParameter) null, bindingResult);

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidation(exception);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("8-12 characters");
    }

    @Test
    void handleUnexpected_ReturnsFiveHundredWithoutLeakingTheRealMessage() {
        // Regression guard for the bug this class exists to fix: an
        // unexpected exception (e.g. a null-content update NPE-ing inside
        // JournalEncryptionService) must reach the client as a clean,
        // non-leaking JSON error instead of a raw 500 - and the real
        // exception's message must never be echoed back to the caller.
        ResponseEntity<ApiResponse<Void>> response = handler.handleUnexpected(new NullPointerException("Cannot invoke getBytes() on null"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).doesNotContain("getBytes");
    }
}
