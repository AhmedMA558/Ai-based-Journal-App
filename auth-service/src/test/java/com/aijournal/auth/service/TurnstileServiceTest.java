package com.aijournal.auth.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TurnstileServiceTest {

    private TurnstileService newService(RestTemplate restTemplate, String secretKey) {
        TurnstileService service = new TurnstileService();
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(service, "secretKey", secretKey);
        return service;
    }

    @Test
    void verify_NoSecretConfigured_SkipsVerificationAndReturnsTrue() {
        // Real production behavior: local dev/CI never configures a real
        // Cloudflare secret, so an unset key must not permanently block
        // every registration/login - it should silently no-op instead.
        TurnstileService service = newService(mock(RestTemplate.class), "");

        assertTrue(service.verify("any-token", "203.0.113.1"));
    }

    @Test
    void verify_BlankToken_ReturnsFalseWithoutCallingSiteverify() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        TurnstileService service = newService(restTemplate, "real-secret");

        assertFalse(service.verify("", "203.0.113.1"));
        assertFalse(service.verify(null, "203.0.113.1"));
    }

    @Test
    void verify_SiteverifyReturnsSuccessTrue_ReturnsTrue() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        when(restTemplate.postForObject(eq("https://challenges.cloudflare.com/turnstile/v0/siteverify"), any(), eq(Map.class)))
                .thenReturn(Map.of("success", true));
        TurnstileService service = newService(restTemplate, "real-secret");

        assertTrue(service.verify("good-token", "203.0.113.1"));
    }

    @Test
    void verify_SiteverifyReturnsSuccessFalse_ReturnsFalse() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        when(restTemplate.postForObject(eq("https://challenges.cloudflare.com/turnstile/v0/siteverify"), any(), eq(Map.class)))
                .thenReturn(Map.of("success", false, "error-codes", java.util.List.of("timeout-or-duplicate")));
        TurnstileService service = newService(restTemplate, "real-secret");

        assertFalse(service.verify("stale-token", "203.0.113.1"));
    }

    @Test
    void verify_SiteverifyCallThrows_FailsClosed() {
        // A Cloudflare-endpoint blip must not become a silent bypass of the
        // one control this class exists to enforce - same no-fail-open
        // precedent as the gateway's JWT filter.
        RestTemplate restTemplate = mock(RestTemplate.class);
        when(restTemplate.postForObject(eq("https://challenges.cloudflare.com/turnstile/v0/siteverify"), any(), eq(Map.class)))
                .thenThrow(new RestClientException("connection refused"));
        TurnstileService service = newService(restTemplate, "real-secret");

        assertFalse(service.verify("any-token", "203.0.113.1"));
    }
}
