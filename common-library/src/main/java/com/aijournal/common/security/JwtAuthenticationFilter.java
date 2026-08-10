package com.aijournal.common.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Independently validates the JWT issued by auth-service on every request reaching a
 * business service directly (i.e. even when the gateway is bypassed). On success, the
 * caller-supplied X-User-Id header is discarded and replaced with the value derived from
 * the verified token, so it can never be spoofed by a direct caller.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String HEADER_USER_ID = "X-User-Id";

    private static final List<String> BASE_PUBLIC_PATHS = List.of(
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/actuator/**"
    );

    private final String jwtSecret;
    private final List<String> publicPaths;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtAuthenticationFilter(String jwtSecret) {
        this(jwtSecret, List.of());
    }

    // additionalPublicPaths lets a consumer add its own genuinely-public endpoints
    // (e.g. auth-service's /login, /register) on top of the shared defaults above -
    // this filter's own gate is independent of whatever a consumer's SecurityConfig
    // permits via authorizeHttpRequests, since the filter runs before that
    // authorization decision and would otherwise reject those paths regardless.
    public JwtAuthenticationFilter(String jwtSecret, List<String> additionalPublicPaths) {
        this.jwtSecret = jwtSecret;
        List<String> merged = new ArrayList<>(BASE_PUBLIC_PATHS);
        merged.addAll(additionalPublicPaths);
        this.publicPaths = merged;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return publicPaths.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            reject(response);
            return;
        }

        String token = authHeader.substring(7);
        if (!JwtUtils.validateToken(token, jwtSecret)) {
            reject(response);
            return;
        }

        Long userId;
        try {
            userId = JwtUtils.getUserId(token, jwtSecret);
        } catch (Exception e) {
            reject(response);
            return;
        }
        if (userId == null) {
            reject(response);
            return;
        }

        List<GrantedAuthority> authorities = safeRoles(token).stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userId, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(new TrustedUserIdRequestWrapper(request, String.valueOf(userId)), response);
    }

    private List<String> safeRoles(String token) {
        try {
            List<String> roles = JwtUtils.getRoles(token, jwtSecret);
            return roles != null ? roles : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private void reject(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\"}");
    }

    private static class TrustedUserIdRequestWrapper extends HttpServletRequestWrapper {
        private final String userId;

        TrustedUserIdRequestWrapper(HttpServletRequest request, String userId) {
            super(request);
            this.userId = userId;
        }

        @Override
        public String getHeader(String name) {
            if (HEADER_USER_ID.equalsIgnoreCase(name)) {
                return userId;
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if (HEADER_USER_ID.equalsIgnoreCase(name)) {
                return Collections.enumeration(Collections.singletonList(userId));
            }
            return super.getHeaders(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> names = Collections.list(super.getHeaderNames());
            if (names.stream().noneMatch(n -> n.equalsIgnoreCase(HEADER_USER_ID))) {
                names.add(HEADER_USER_ID);
            }
            return Collections.enumeration(names);
        }
    }
}
