package com.aijournal.common.security;

import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationFilterTest {

    private static final String SECRET = "test-jwt-secret-key-at-least-256-bits-long-for-hs256!!";

    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(SECRET);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private String buildToken(long expiresInMillis, Long userId, List<String> roles) {
        SecretKey key = JwtUtils.getSigningKey(SECRET);
        Date now = new Date();
        var builder = Jwts.builder()
                .subject("user@example.com")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiresInMillis))
                .signWith(key);
        if (userId != null) {
            builder.claim("userId", userId);
        }
        if (roles != null) {
            builder.claim("roles", roles);
        }
        return builder.compact();
    }

    @Test
    void shouldNotFilter_ActuatorPath_ReturnsTrue() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldNotFilter_SwaggerPath_ReturnsTrue() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/swagger-ui/index.html");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldNotFilter_ApiDocsPath_ReturnsTrue() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/v3/api-docs/swagger-config");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldNotFilter_ProtectedPath_ReturnsFalse() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/journals");
        assertThat(filter.shouldNotFilter(request)).isFalse();
    }

    @Test
    void doFilterInternal_MissingAuthHeader_Returns401AndDoesNotContinueChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/journals");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<HttpServletRequest> captured = new AtomicReference<>();
        FilterChain chain = (req, res) -> captured.set((HttpServletRequest) req);

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(captured.get()).isNull();
    }

    @Test
    void doFilterInternal_MalformedAuthHeader_Returns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/journals");
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<HttpServletRequest> captured = new AtomicReference<>();
        FilterChain chain = (req, res) -> captured.set((HttpServletRequest) req);

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(captured.get()).isNull();
    }

    @Test
    void doFilterInternal_InvalidToken_Returns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/journals");
        request.addHeader("Authorization", "Bearer not-a-real-jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<HttpServletRequest> captured = new AtomicReference<>();
        FilterChain chain = (req, res) -> captured.set((HttpServletRequest) req);

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(captured.get()).isNull();
    }

    @Test
    void doFilterInternal_ExpiredToken_Returns401() throws Exception {
        String token = buildToken(-60_000, 1L, List.of("USER"));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/journals");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<HttpServletRequest> captured = new AtomicReference<>();
        FilterChain chain = (req, res) -> captured.set((HttpServletRequest) req);

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(captured.get()).isNull();
    }

    @Test
    void doFilterInternal_ValidToken_SetsSecurityContextAndForwardsRequest() throws Exception {
        String token = buildToken(60_000, 42L, List.of("USER"));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/journals");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<HttpServletRequest> captured = new AtomicReference<>();
        FilterChain chain = (req, res) -> captured.set((HttpServletRequest) req);

        filter.doFilterInternal(request, response, chain);

        assertThat(captured.get()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal()).isEqualTo(42L);
    }

    @Test
    void doFilterInternal_ValidToken_OverridesClientSuppliedXUserIdHeader() throws Exception {
        String token = buildToken(60_000, 42L, List.of("USER"));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/journals");
        request.addHeader("Authorization", "Bearer " + token);
        request.addHeader("X-User-Id", "9999");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<HttpServletRequest> captured = new AtomicReference<>();
        FilterChain chain = (req, res) -> captured.set((HttpServletRequest) req);

        filter.doFilterInternal(request, response, chain);

        assertThat(captured.get().getHeader("X-User-Id")).isEqualTo("42");
    }
}
