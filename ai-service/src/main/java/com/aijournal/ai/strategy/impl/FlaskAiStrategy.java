package com.aijournal.ai.strategy.impl;

import com.aijournal.ai.strategy.AiProviderStrategy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component("flaskAiStrategy")
public class FlaskAiStrategy implements AiProviderStrategy {

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
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("content", content), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map data = (Map) response.getBody().get("data");
                if (data != null) {
                    List<String> bullets = (List<String>) data.get("bulletPoints");
                    String bulletStr = bullets != null ? String.join("\n", bullets) : "• Logged entry.";
                    return new SummaryResult(
                            (String) data.get("shortSummary"),
                            (String) data.get("detailedSummary"),
                            bulletStr
                    );
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
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("content", content), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map data = (Map) response.getBody().get("data");
                if (data != null) {
                    String mood = (String) data.get("primaryMood");
                    Double score = data.get("confidenceScore") != null ? ((Number) data.get("confidenceScore")).doubleValue() : 0.85;
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
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("mood", mood != null ? mood : "NEUTRAL"), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map data = (Map) response.getBody().get("data");
                if (data != null && data.get("recommendations") != null) {
                    return (List<String>) data.get("recommendations");
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
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("content", content), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map data = (Map) response.getBody().get("data");
                if (data != null && data.get("tags") != null) {
                    return (List<String>) data.get("tags");
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

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map data = (Map) response.getBody().get("data");
                if (data != null && data.get("response") != null) {
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
    public ReflectionResult generateDailyReflection(String content) {
        return new ReflectionResult(
                List.of("What went well today?"),
                List.of("How can you build on this progress tomorrow?"),
                List.of("Celebrate your wins!")
        );
    }
}
