package com.aijournal.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

public class JwtUtils {

    public static SecretKey getSigningKey(String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public static Claims parseToken(String token, String secret) {
        return Jwts.parser()
                .verifyWith(getSigningKey(secret))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public static boolean validateToken(String token, String secret) {
        try {
            Claims claims = parseToken(token, secret);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public static String getUsername(String token, String secret) {
        return parseToken(token, secret).getSubject();
    }

    public static Long getUserId(String token, String secret) {
        Object userIdObj = parseToken(token, secret).get("userId");
        if (userIdObj instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(userIdObj.toString());
    }

    @SuppressWarnings("unchecked")
    public static List<String> getRoles(String token, String secret) {
        return (List<String>) parseToken(token, secret).get("roles");
    }
}
