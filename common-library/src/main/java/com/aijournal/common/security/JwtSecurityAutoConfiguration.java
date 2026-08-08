package com.aijournal.common.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

/**
 * Ships JWT validation to every business service that depends on common-library, without
 * requiring each service to write its own SecurityConfig. Backs off entirely (via
 * ConditionalOnMissingBean on the nested config) for any service - currently only
 * auth-service - that already defines its own SecurityFilterChain.
 */
@AutoConfiguration
@ConditionalOnClass(SecurityFilterChain.class)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name = "app.security.jwt.enabled", havingValue = "true", matchIfMissing = true)
public class JwtSecurityAutoConfiguration {

    @Configuration
    @EnableWebSecurity
    @ConditionalOnMissingBean(SecurityFilterChain.class)
    static class JwtSecurityFilterChainConfiguration {

        @Value("${jwt.secret}")
        private String jwtSecret;

        @Bean
        public JwtAuthenticationFilter jwtAuthenticationFilter() {
            return new JwtAuthenticationFilter(jwtSecret);
        }

        // The filter above is wired into the Spring Security chain explicitly via
        // addFilterBefore below. Without this, Spring Boot would ALSO auto-register it as
        // a standalone servlet filter (any Filter @Bean is picked up by
        // ServletContextInitializerBeans by default), causing it to run twice per request.
        @Bean
        public FilterRegistrationBean<JwtAuthenticationFilter> jwtAuthenticationFilterRegistration(
                JwtAuthenticationFilter jwtAuthenticationFilter) {
            FilterRegistrationBean<JwtAuthenticationFilter> registration =
                    new FilterRegistrationBean<>(jwtAuthenticationFilter);
            registration.setEnabled(false);
            return registration;
        }

        @Bean
        public SecurityFilterChain jwtSecurityFilterChain(HttpSecurity http,
                                                            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
            http
                    .csrf(AbstractHttpConfigurer::disable)
                    .cors(AbstractHttpConfigurer::disable)
                    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers(
                                    AntPathRequestMatcher.antMatcher("/v3/api-docs/**"),
                                    AntPathRequestMatcher.antMatcher("/swagger-ui/**"),
                                    AntPathRequestMatcher.antMatcher("/swagger-ui.html"),
                                    AntPathRequestMatcher.antMatcher("/actuator/**")
                            ).permitAll()
                            .anyRequest().authenticated()
                    )
                    .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

            return http.build();
        }
    }
}
