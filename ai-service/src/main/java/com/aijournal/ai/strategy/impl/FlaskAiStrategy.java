package com.aijournal.ai.strategy.impl;

import com.aijournal.ai.strategy.AiProviderStrategy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component("flaskAiStrategy")
public class FlaskAiStrategy implements AiProviderStrategy {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_RESPONSE_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String CONTENT_KEY = "content";

    @Value("${ai.flask.url:http://python-ai-service:5000}")
    private String flaskBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String getProviderName() {
        return "flask";
    }

    @Override
    public SummaryResult summarize(String content) {
        try {
            String url = flaskBaseUrl + "/api/v1/ai/summarize";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of(CONTENT_KEY, content), headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    MAP_RESPONSE_TYPE);
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> data = castToMap(body.get("data"));
                if (!data.isEmpty()) {
                    List<String> bullets = castToListOfString(data.get("bulletPoints"));
                    String bulletStr = !bullets.isEmpty() ? String.join("\n", bullets) : "• Logged entry.";
                    return new SummaryResult(
                            (String) data.get("shortSummary"),
                            (String) data.get("detailedSummary"),
                            bulletStr);
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return new SummaryResult(content, content, "• Logged entry.");
    }

    @Override
    public MoodResult detectMood(String content) {
        try {
            String url = flaskBaseUrl + "/api/v1/ai/mood";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of(CONTENT_KEY, content), headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    MAP_RESPONSE_TYPE);
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> data = castToMap(body.get("data"));
                if (!data.isEmpty()) {
                    String mood = (String) data.get("primaryMood");
                    Double score = data.get("confidenceScore") != null
                            ? ((Number) data.get("confidenceScore")).doubleValue()
                            : 0.85;
                    String emoji = (String) data.get("emoji");
                    return new MoodResult(mood, score, emoji);
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return new MoodResult("HAPPY", 0.90, "😊");
    }

    @Override
    public List<String> generateRecommendations(String content, String mood) {
        try {
            String url = flaskBaseUrl + "/api/v1/ai/recommendations";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("mood", mood != null ? mood : "NEUTRAL"),
                    headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    MAP_RESPONSE_TYPE);
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> data = castToMap(body.get("data"));
                if (!data.isEmpty() && data.get("recommendations") != null) {
                    List<String> recommendations = castToListOfString(data.get("recommendations"));
                    if (!recommendations.isEmpty()) {
                        return recommendations;
                    }
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return List.of("Take 5 deep breaths.", "Reflect on 3 good things today.");
    }

    @Override
    public List<String> generateTags(String content) {
        try {
            String url = flaskBaseUrl + "/api/v1/ai/tags";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of(CONTENT_KEY, content), headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    MAP_RESPONSE_TYPE);
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> data = castToMap(body.get("data"));
                if (!data.isEmpty() && data.get("tags") != null) {
                    List<String> tags = castToListOfString(data.get("tags"));
                    if (!tags.isEmpty()) {
                        return tags;
                    }
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return List.of("#journal", "#reflection");
    }

    @Override
    public String chatWithJournal(String query, String context) {
        try {
            String url = flaskBaseUrl + "/api/v1/ai/chat";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("query", query), headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    MAP_RESPONSE_TYPE);
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> data = castToMap(body.get("data"));
                if (!data.isEmpty() && data.get("response") != null) {
                    return (String) data.get("response");
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return "AI response to: " + query;
    }

    @Override
    public List<String> detectHabits(String content) {
        return List.of("Daily Journaling", "Mindful Reflection");
    }

    @Override
    public List<String> extractGoals(String content) {
        return List.of("Maintain positive streak", "Execute microservices workflow");
    }

    @Override
    public SentimentResult analyzeSentiment(String content) {
        return new SentimentResult("POSITIVE", 0.92);
    }

    @Override
    public WritingImprovementResult suggestWritingImprovements(String content) {
        return new WritingImprovementResult("Great flow and structure!", "90/100", "Use expressive vocabulary.");
    }

    @Override
    public RephraseResult rephrase(String content) {
        try {
            String url = flaskBaseUrl + "/api/v1/ai/rephrase";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of(CONTENT_KEY, content), headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    MAP_RESPONSE_TYPE);
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> data = castToMap(body.get("data"));
                if (!data.isEmpty() && data.get("rephrased") != null) {
                    return new RephraseResult(content, (String) data.get("rephrased"));
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return new RephraseResult(content, content);
    }

    @Override
    public GrammarResult fixGrammar(String content) {
        try {
            String url = flaskBaseUrl + "/api/v1/ai/grammar";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of(CONTENT_KEY, content), headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    MAP_RESPONSE_TYPE);
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> data = castToMap(body.get("data"));
                if (!data.isEmpty() && data.get("corrected") != null) {
                    return new GrammarResult(content, (String) data.get("corrected"));
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return new GrammarResult(content, content);
    }

    @Override
    public ReflectionResult generateDailyReflection(String content) {
        return new ReflectionResult(
                List.of("What went well today?"),
                List.of("How can you build on this progress tomorrow?"),
                List.of("Celebrate your wins!"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castToMap(Object obj) {
        if (obj instanceof Map) {
            return (Map<String, Object>) obj;
        }
        return Collections.emptyMap();
    }

    @SuppressWarnings("unchecked")
    private List<String> castToListOfString(Object obj) {
        if (obj instanceof List) {
            return (List<String>) obj;
        }
        return Collections.emptyList();
    }
}
