package com.aijournal.auth.config;

import com.aijournal.common.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // Kept as a single list so the filter's own gate (below) and Spring Security's
    // authorizeHttpRequests permitAll (further below) can't drift apart - the filter
    // runs before Spring Security's authorization decision and would otherwise reject
    // these paths outright regardless of what authorizeHttpRequests says.
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/auth/mfa/verify",
            "/api/v1/auth/password/forgot",
            "/api/v1/auth/password/reset",
            "/error"
    );

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Reuses common-library's JWT filter directly rather than duplicating auth
    // logic. Closes the gap where a direct call to this service's own port
    // (bypassing the gateway) previously reached MFA-enrollment/password-change
    // endpoints with no authentication at all - the other 8 business services
    // already get this protection "for free" via JwtSecurityAutoConfiguration;
    // auth-service opts out of that auto-config by defining its own chain, so
    // it needs the filter wired in explicitly.
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(@Value("${jwt.secret}") String jwtSecret) {
        return new JwtAuthenticationFilter(jwtSecret, PUBLIC_PATHS);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                AntPathRequestMatcher.antMatcher("/api/v1/auth/register"),
                                AntPathRequestMatcher.antMatcher("/api/v1/auth/login"),
                                AntPathRequestMatcher.antMatcher("/api/v1/auth/refresh"),
                                AntPathRequestMatcher.antMatcher("/api/v1/auth/logout"),
                                AntPathRequestMatcher.antMatcher("/api/v1/auth/mfa/verify"),
                                AntPathRequestMatcher.antMatcher("/api/v1/auth/password/forgot"),
                                AntPathRequestMatcher.antMatcher("/api/v1/auth/password/reset"),
                                AntPathRequestMatcher.antMatcher("/v3/api-docs/**"),
                                AntPathRequestMatcher.antMatcher("/swagger-ui/**"),
                                AntPathRequestMatcher.antMatcher("/swagger-ui.html"),
                                AntPathRequestMatcher.antMatcher("/actuator/**"),
                                // Spring Boot's default error handling forwards here internally for
                                // any uncaught exception (e.g. @ResponseStatus) or unmatched route -
                                // without this, that forward itself gets blocked, and every error
                                // response (401, 404, 405, ...) gets rewritten into an opaque 403.
                                AntPathRequestMatcher.antMatcher("/error")
                        ).permitAll()
                        // Everything else - /me, /password, /mfa/setup|enable|disable|status -
                        // now genuinely requires a valid JWT, verified by the filter below.
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
