package com.aijournal.common.web;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.exception.BadRequestException;
import com.aijournal.common.exception.ForbiddenException;
import com.aijournal.common.exception.ResourceNotFoundException;
import com.aijournal.common.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

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
