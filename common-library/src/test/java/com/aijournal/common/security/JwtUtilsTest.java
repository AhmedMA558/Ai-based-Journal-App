package com.aijournal.common.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilsTest {

    private static final String SECRET = "test-jwt-secret-key-at-least-256-bits-long-for-hs256!!";

    private String buildToken(String secret, long expiresInMillis, Long userId, List<String> roles) {
        SecretKey key = JwtUtils.getSigningKey(secret);
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
    void validateToken_ValidUnexpiredToken_ReturnsTrue() {
        String token = buildToken(SECRET, 60_000, 1L, List.of("USER"));
        assertThat(JwtUtils.validateToken(token, SECRET)).isTrue();
    }

    @Test
    void validateToken_ExpiredToken_ReturnsFalse() {
        String token = buildToken(SECRET, -60_000, 1L, List.of("USER"));
        assertThat(JwtUtils.validateToken(token, SECRET)).isFalse();
    }

    @Test
    void validateToken_TamperedSignature_ReturnsFalse() {
        String token = buildToken(SECRET, 60_000, 1L, List.of("USER"));
        String tampered = token.substring(0, token.length() - 4) + "abcd";
        assertThat(JwtUtils.validateToken(tampered, SECRET)).isFalse();
    }

    @Test
    void validateToken_WrongSigningSecret_ReturnsFalse() {
        String token = buildToken(SECRET, 60_000, 1L, List.of("USER"));
        assertThat(JwtUtils.validateToken(token, "a-completely-different-signing-secret-value-1234")).isFalse();
    }

    @Test
    void getUserId_NumericClaim_ReturnsLong() {
        String token = buildToken(SECRET, 60_000, 42L, List.of("USER"));
        assertThat(JwtUtils.getUserId(token, SECRET)).isEqualTo(42L);
    }

    @Test
    void getUserId_StringifiedClaim_ParsesToLong() {
        SecretKey key = JwtUtils.getSigningKey(SECRET);
        String token = Jwts.builder()
                .subject("user@example.com")
                .claim("userId", "77")
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key)
                .compact();
        assertThat(JwtUtils.getUserId(token, SECRET)).isEqualTo(77L);
    }

    @Test
    void getRoles_ReturnsRolesList() {
        String token = buildToken(SECRET, 60_000, 1L, List.of("USER", "ADMIN"));
        assertThat(JwtUtils.getRoles(token, SECRET)).containsExactly("USER", "ADMIN");
    }

    @Test
    void getUsername_ReturnsSubjectClaim() {
        String token = buildToken(SECRET, 60_000, 1L, List.of("USER"));
        assertThat(JwtUtils.getUsername(token, SECRET)).isEqualTo("user@example.com");
    }

    @Test
    void parseToken_MalformedToken_ThrowsException() {
        assertThatThrownBy(() -> JwtUtils.parseToken("not-a-real-jwt", SECRET))
                .isInstanceOf(JwtException.class);
    }
}
