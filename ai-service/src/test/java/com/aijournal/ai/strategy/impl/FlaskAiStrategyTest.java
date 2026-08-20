package com.aijournal.ai.strategy.impl;

import com.aijournal.ai.strategy.AiProviderStrategy.MoodResult;
import com.aijournal.ai.strategy.AiProviderStrategy.SentimentResult;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FlaskAiStrategyTest {

    @Mock
    private RestTemplate restTemplate;

    private FlaskAiStrategy strategy;

    @BeforeEach
    void setUp() {
        strategy = new FlaskAiStrategy();
        ReflectionTestUtils.setField(strategy, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(strategy, "flaskBaseUrl", "http://python-ai-service:5000");
    }

    @Test
    void detectMood_PythonServiceUnreachable_FallsBackToNeutralAtZeroConfidence_NotFakeHappy() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(),
                any(ParameterizedTypeReference.class)))
                .thenThrow(new RestClientException("connection refused"));

        MoodResult result = strategy.detectMood("some journal content");

        // The old fallback fabricated HAPPY/0.90, indistinguishable from a real
        // detection once persisted to mood_history - NEUTRAL/0.0 is trivially
        // recognizable as "no real detection happened."
        assertThat(result.primaryMood()).isEqualTo("NEUTRAL");
        assertThat(result.confidenceScore()).isEqualTo(0.0);
    }

    @Test
    void detectMood_RealResponse_ReturnsRealMood() {
        Map<String, Object> data = Map.of("primaryMood", "SAD", "confidenceScore", 0.87, "emoji", "😢");
        Map<String, Object> body = Map.of("data", data);
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(),
                any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        MoodResult result = strategy.detectMood("I feel so sad today");

        assertThat(result.primaryMood()).isEqualTo("SAD");
        assertThat(result.confidenceScore()).isEqualTo(0.87);
    }

    @Test
    void analyzeSentiment_PythonServiceUnreachable_FallsBackToNeutralAtZeroConfidence_NotFakePositive() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(),
                any(ParameterizedTypeReference.class)))
                .thenThrow(new RestClientException("connection refused"));

        SentimentResult result = strategy.analyzeSentiment("some journal content");

        // The old implementation was a hardcoded POSITIVE/0.92 regardless of
        // input and regardless of whether python-ai-service was even reachable.
        assertThat(result.sentiment()).isEqualTo("NEUTRAL");
        assertThat(result.score()).isEqualTo(0.0);
    }

    @Test
    void analyzeSentiment_RealResponse_ReturnsRealClassification_NotHardcodedPositive() {
        Map<String, Object> data = Map.of("sentiment", "NEGATIVE", "score", 0.81);
        Map<String, Object> body = Map.of("data", data);
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(),
                any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        SentimentResult result = strategy.analyzeSentiment("this is a terrible, awful day");

        assertThat(result.sentiment()).isEqualTo("NEGATIVE");
        assertThat(result.score()).isEqualTo(0.81);
    }

    @SuppressWarnings("unchecked")
    @Test
    void chatWithJournal_ForwardsContext_NotSilentlyDropped() {
        // chatWithJournal's signature always accepted a `context` parameter, but the
        // request body sent to python-ai-service only ever contained `query` - so the
        // endpoint (documented as "Chat with your Journal History") had no way to ever
        // actually be journal-aware, regardless of what context callers supplied.
        Map<String, Object> data = Map.of("response", "a reply", "provider", "python-ai");
        Map<String, Object> body = Map.of("data", data);
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(),
                any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        strategy.chatWithJournal("how am I doing?", "feeling overwhelmed with work");

        ArgumentCaptor<HttpEntity<Map<String, String>>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(any(String.class), eq(HttpMethod.POST), entityCaptor.capture(),
                any(ParameterizedTypeReference.class));
        Map<String, String> sentBody = entityCaptor.getValue().getBody();

        assertThat(sentBody).containsEntry("query", "how am I doing?");
        assertThat(sentBody).containsEntry("context", "feeling overwhelmed with work");
    }

    @Test
    void chatWithJournal_NullContext_SendsEmptyStringNotNull() {
        // Map.of throws NPE on a null value - context must be coerced to "" before
        // building the request body, not passed through as-is.
        Map<String, Object> data = Map.of("response", "a reply", "provider", "python-ai");
        Map<String, Object> body = Map.of("data", data);
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(),
                any(ParameterizedTypeReference.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        String result = strategy.chatWithJournal("hello", null);

        assertThat(result).isEqualTo("a reply");
    }
}
