package com.aijournal.recommendation.service.impl;

import com.aijournal.recommendation.service.RecommendationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RecommendationServiceImpl implements RecommendationService {

    @Override
    public Map<String, Object> getPersonalizedRecommendations(Long userId, String currentMood) {
        String mood = (currentMood != null) ? currentMood.toUpperCase() : "NEUTRAL";
        return Map.of(
                "userId", userId,
                "currentMood", mood,
                "recommendedPrompts", List.of(
                        "What is one positive thing that surprised you today?",
                        "What habit helped you feel most accomplished this week?"
                ),
                "recommendedBooks", List.of(
                        Map.of("title", "Atomic Habits", "author", "James Clear"),
                        Map.of("title", "The Power of Now", "author", "Eckhart Tolle")
                ),
                "recommendedMeditation", List.of(
                        Map.of("title", "10-Min Stress Relief Breathing", "duration", "10 mins"),
                        Map.of("title", "Evening Reflection Meditation", "duration", "15 mins")
                ),
                "recommendedMusicPlaylists", List.of(
                        "Lo-Fi Calm Study Beats",
                        "Peaceful Piano Melodies"
                ),
                "recommendedExercises", List.of(
                        "20-minute Light Jog",
                        "Gentle Evening Yoga Stretch"
                ),
                "recommendedPodcasts", List.of(
                        "The Huberman Lab: Science of Mental Well-being",
                        "On Purpose with Jay Shetty"
                )
        );
    }

    @Override
    public List<String> getJournalPrompts(String category) {
        return List.of(
                "Write down 3 things you are deeply grateful for today.",
                "Describe a situation that challenged you and how you handled it.",
                "Where do you see yourself mentally and emotionally 6 months from now?"
        );
    }
}
