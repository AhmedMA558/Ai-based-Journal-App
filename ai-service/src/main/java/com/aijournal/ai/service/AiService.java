package com.aijournal.ai.service;

import com.aijournal.ai.entity.MoodHistory;
import com.aijournal.ai.strategy.AiProviderStrategy.*;

import java.util.List;
import java.util.Map;

public interface AiService {
    SummaryResult summarizeJournal(String content);
    // authorizationHeader is used to verify (via journal-service) that a
    // non-zero journalId actually belongs to userId before persisting a
    // MoodHistory row against it - journalId is otherwise a caller-supplied
    // value with no ownership check of its own.
    MoodResult detectAndSaveMood(Long userId, Long journalId, String content, String authorizationHeader);
    List<MoodHistory> getEmotionTimeline(Long userId, String period);
    List<String> getRecommendations(String content, String mood);
    List<String> generateTags(String content);
    // history is prior conversation turns, oldest first - see
    // AiProviderStrategy.chatWithJournal's javadoc for why this matters.
    String chatWithJournal(Long userId, String query, String context, List<Map<String, String>> history, String authorizationHeader);
    RephraseResult rephrase(String content);
    GrammarResult fixGrammar(String content);
}
